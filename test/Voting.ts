import { expect } from "chai";
import hre from "hardhat";


describe("Voting contract", function() {

    const candidates = ["Bob", "Alice"];
    const candidateAddresses = ["0x98cC8F6627688A48D2A4cc17Cd79741cC67c9DdA", "0x0D476789a3B7C3D19cA3E02394a934bb84fC31D3"];
    const amountToSendWithVote = hre.ethers.parseEther("1.0");

    
    async function deploymentFixture(candidates: string[], candidateAddresses: string[]) {
        const [setuper, timer, otherAccount] = await hre.ethers.getSigners();
        const Voting = await hre.ethers.getContractFactory("Voting");
        const voting = await Voting.deploy(candidates, candidateAddresses, setuper, timer);
        return { voting, setuper, timer, otherAccount }
    }

    it ("Should allow a random person to vote", async function() {
        const {voting, timer, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(0, {value: amountToSendWithVote})).not.to.be.reverted;
    })

    it ("Should not allow a person to vote twice", async function() {
        const {voting, timer, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
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
        const {voting, timer, otherAccount} = await deploymentFixture([], []);
        await voting.connect(timer).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1, {value: amountToSendWithVote})).to.be.revertedWith(
            "The candidate does not exist!");
    })

    it ("Should update the number of votes for a candidate", async function() {
        const {voting, timer, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await voting.connect(otherAccount).vote(0, {value: amountToSendWithVote});
        const candidate = await voting.getCandidate(0)
        expect(BigInt(candidate.votes)).to.equal(BigInt("1"));
    })

    it ("Should not allow votes after the end of the voting period", async function() {
        const {voting, timer, otherAccount} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await voting.connect(timer).endVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1, {value: amountToSendWithVote})).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should correctly compute the winner of the election", async function () {
        const {voting, setuper, timer, otherAccount } = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await voting.connect(timer).vote(0, {value: amountToSendWithVote});
        await voting.connect(otherAccount).vote(1, {value: amountToSendWithVote});
        await voting.connect(setuper).vote(1, {value: amountToSendWithVote});
        await voting.connect(timer).endVotingPeriod();
        expect(BigInt((await voting.getWinner())[0])).to.equal(BigInt("1"));
    })

    it ("Should not compute the winner of the election during the voting period", async function() {
        const {voting, timer} = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await expect(voting.getWinner()).to.be.revertedWith("The voting period is not finished yet!")
    })

    it ("Should allow a voter to withdraw stake", async function() {
        const {voting, timer } = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await voting.connect(timer).vote(0, {value: amountToSendWithVote});
        await voting.connect(timer).endVotingPeriod();
        await expect(voting.connect(timer).withdrawStake()).not.to.be.reverted;
    })

    it ("Should not allow a voter to withdraw stake twice", async function() {
        const {voting, timer } = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await voting.connect(timer).vote(0, {value: amountToSendWithVote});
        await voting.connect(timer).endVotingPeriod();
        await expect(voting.connect(timer).withdrawStake()).not.to.be.reverted;
        await expect(voting.connect(timer).withdrawStake()).to.be.reverted;
    
    it ("Should allow the setuper to reset the election", async function() {
        const {voting, timer, setuper } = await deploymentFixture(candidates, candidateAddresses);
        await voting.connect(timer).startVotingPeriod();
        await voting.connect(timer).vote(0, {value: amountToSendWithVote});
        await voting.connect(timer).endVotingPeriod();
        await expect(voting.connect(setuper).startNewElection(["Joe, Jack"], ["0x98cC8F6627688A48D2A4cc17Cd79741cC67c9DdA", "0x0D476789a3B7C3D19cA3E02394a934bb84fC31D3"])).not.to.be.reverted;
    })
    })
});


