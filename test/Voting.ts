import { expect } from "chai";
import hre from "hardhat";


describe("Voting contract", function() {
    async function deploymentFixture() {
        const [owner, otherAccount, anotherAccountAgain] = await hre.ethers.getSigners();
        const Voting = await hre.ethers.getContractFactory("Voting");
        const voting = await Voting.deploy();
        return { voting, owner, otherAccount, anotherAccountAgain }
    }
    it("Should deploy the contract and set the right owner", async function () {
       const {voting, owner} = await deploymentFixture();
        expect(await voting.owner()).to.equal(owner.address);

    });

    it("Should add a candidate when addCandidate is called by the owner", async function() {
        const {voting, owner} = await deploymentFixture();
        await expect(voting.connect(owner).addCandidate("Candidate 0")).not.to.be.reverted;
        const candidatesCount = await voting.getCandidatesCount();
        expect(candidatesCount).equals(1);
        const candidate = await voting.getCandidate(0);
        expect(BigInt(candidate.votes)).to.equal(BigInt("0"));
    })

    it("Should emit an event on candidate adding", async function() {
        const {voting, owner} = await deploymentFixture();
        await expect(voting.addCandidate("Candidate 0"))
        .to.emit(voting, "AddedCandidate").withArgs("Candidate 0");
    })

    it("Should not add a candidate when addCandidate is called by an other account", async function() {
        const {voting, otherAccount} = await deploymentFixture();
        await expect(voting.connect(otherAccount).addCandidate("Candidate 0")).to.be.reverted;
    })

    it ("Should allow a random person to vote", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(0)).not.to.be.reverted;
    })

    it ("Should not allow a person to vote twice", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(otherAccount).vote(0);
        await expect(voting.connect(otherAccount).vote(0)).to.be.revertedWith(
            "You already voted!");
    })

    it ("Should not allow a person to vote if the voting period is not running", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await expect(voting.connect(otherAccount).vote(0)).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should not allow to vote for an unregistered candidate", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1)).to.be.revertedWith(
            "The candidate does not exist!");
    })

    it ("Should update the number of votes for a candidate", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(otherAccount).vote(0);
        expect(BigInt(await voting.getCandidateVotesCount(0))).to.equal(BigInt("1"));
        const candidate = await voting.getCandidate(0)
        expect(BigInt(candidate.votes)).to.equal(BigInt("1"));
    })

    it ("Should not allow votes after the end of the voting period", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).endVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1)).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should correctly compute the winner of the election", async function () {
        const {voting, owner, otherAccount, anotherAccountAgain} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).addCandidate("Candidate 1");
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).vote(0);
        await voting.connect(otherAccount).vote(1);
        await voting.connect(anotherAccountAgain).vote(1);
        await voting.connect(owner).endVotingPeriod();
        expect(BigInt((await voting.getWinner())[0])).to.equal(BigInt("1"));
    })

    it ("Should not compute the winner of the election during the voting period", async function() {
        const {voting, owner, otherAccount, anotherAccountAgain} = await deploymentFixture();
        await voting.connect(owner).addCandidate("Candidate 0");
        await voting.connect(owner).addCandidate("Candidate 1");
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.getWinner()).to.be.revertedWith("The voting period is not finished yet!")
    })
});


