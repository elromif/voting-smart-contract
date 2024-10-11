import { expect } from "chai";
import hre from "hardhat";


describe("Voting contract", function() {

    const candidates = ["Bob", "Alice"];
    const candidateAddresses = ["0x98cC8F6627688A48D2A4cc17Cd79741cC67c9DdA", "0x0D476789a3B7C3D19cA3E02394a934bb84fC31D3"];
    const amountToSendWithVote = hre.ethers.parseEther("1.0");

    
    async function deploymentFixture(candidates: string[], candidateAddresses: string[]) {
        const [owner, otherAccount, anotherAccountAgain] = await hre.ethers.getSigners();
        const Voting = await hre.ethers.getContractFactory("Voting");
        const voting = await Voting.deploy(candidates, candidateAddresses);
        return { voting, owner, otherAccount, anotherAccountAgain }
    }
    
    it("Should deploy the contract and set the right owner", async function () {
       const {voting, owner} = await deploymentFixture(candidates, candidateAddresses);
        expect(await voting.owner()).to.equal(owner.address);

    });

    it ("Should allow a random person to vote", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(0, {value: amountToSendWithVote})).not.to.be.reverted;
    })

    it ("Should not allow a person to vote twice", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(otherAccount).vote(0, {value: amountToSendWithVote});
        await expect(voting.connect(otherAccount).vote(0, {value: amountToSendWithVote})).to.be.revertedWith(
            "You already voted!");
    })

    it ("Should not allow a person to vote if the voting period is not running", async function() {
        const {voting, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await expect(voting.connect(otherAccount).vote(0, {value: amountToSendWithVote})).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should not allow to vote for an unregistered candidate", async function() {
        const noCandidates: string[] = []
        const {voting, owner, otherAccount} = await deploymentFixture(noCandidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1, {value: amountToSendWithVote})).to.be.revertedWith(
            "The candidate does not exist!");
    })

    it ("Should update the number of votes for a candidate", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(otherAccount).vote(0, {value: amountToSendWithVote});
        const candidate = await voting.getCandidate(0)
        expect(BigInt(candidate.votes)).to.equal(BigInt("1"));
    })

    it ("Should not allow votes after the end of the voting period", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).endVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1, {value: amountToSendWithVote})).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should correctly compute the winner of the election", async function () {
        const {voting, owner, otherAccount, anotherAccountAgain} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).vote(0, {value: amountToSendWithVote});
        await voting.connect(otherAccount).vote(1, {value: amountToSendWithVote});
        await voting.connect(anotherAccountAgain).vote(1, {value: amountToSendWithVote});
        await voting.connect(owner).endVotingPeriod();
        expect(BigInt((await voting.getWinner())[0])).to.equal(BigInt("1"));
    })

    it ("Should send the nest egg to the winner when ending the voting period", async function() {
        const {voting, owner} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).vote(0, {value: amountToSendWithVote});

        const balanceBefore = await hre.ethers.provider.getBalance((await voting.getCandidate(0)).candidate_address);
        await voting.connect(owner).endVotingPeriod();

        const expectedBalance = balanceBefore + hre.ethers.WeiPerEther
        const balanceAfter = await hre.ethers.provider.getBalance((await voting.getCandidate(0)).candidate_address);

        expect(balanceAfter).to.equal(expectedBalance);
    })

    it ("Should not compute the winner of the election during the voting period", async function() {
        const {voting, owner} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.getWinner()).to.be.revertedWith("The voting period is not finished yet!")
    })

    it ("Should allow anyone to congratulate the winner by sending ETH", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        const amountToSend = hre.ethers.parseEther("1.0");

        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).vote(1, {value: amountToSendWithVote});
        await voting.connect(owner).endVotingPeriod();

        const winner = await voting.getWinner();
        const balanceBefore = await hre.ethers.provider.getBalance(winner.candidate_address);
        await voting.connect(otherAccount).congratulateWinner({ value: amountToSend });
        
        const expectedBalance = balanceBefore + hre.ethers.WeiPerEther
        const balanceAfter = await hre.ethers.provider.getBalance(winner.candidate_address);

        expect(balanceAfter).to.equal(expectedBalance);
    })

    it ("Should not allow to send 0.0 ETH to the winner", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        const amountToSend = hre.ethers.parseEther("0.0");

        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).vote(0, {value: amountToSendWithVote});
        await voting.connect(owner).endVotingPeriod();
        await expect(voting.connect(otherAccount).congratulateWinner({ value: amountToSend })).to.be.reverted;
    })
});


