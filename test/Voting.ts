import { expect } from "chai";
import hre from "hardhat";


describe("Voting contract", function() {

    const candidates = ["Bob", "Alice"];

    
    async function deploymentFixture(candidates: string[]) {
        const [owner, otherAccount, anotherAccountAgain] = await hre.ethers.getSigners();
        const Voting = await hre.ethers.getContractFactory("Voting");
        const voting = await Voting.deploy(candidates);
        return { voting, owner, otherAccount, anotherAccountAgain }
    }
    
    it("Should deploy the contract and set the right owner", async function () {
       const {voting, owner} = await deploymentFixture(candidates);
        expect(await voting.owner()).to.equal(owner.address);

    });

    it ("Should allow a random person to vote", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates);
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(0)).not.to.be.reverted;
    })

    it ("Should not allow a person to vote twice", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(otherAccount).vote(0);
        await expect(voting.connect(otherAccount).vote(0)).to.be.revertedWith(
            "You already voted!");
    })

    it ("Should not allow a person to vote if the voting period is not running", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates);
        await expect(voting.connect(otherAccount).vote(0)).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should not allow to vote for an unregistered candidate", async function() {
        const noCandidates: string[] = []
        const {voting, owner, otherAccount} = await deploymentFixture(noCandidates);
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1)).to.be.revertedWith(
            "The candidate does not exist!");
    })

    it ("Should update the number of votes for a candidate", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(otherAccount).vote(0);
        const candidate = await voting.getCandidate(0)
        expect(BigInt(candidate.votes)).to.equal(BigInt("1"));
    })

    it ("Should not allow votes after the end of the voting period", async function() {
        const {voting, owner, otherAccount} = await deploymentFixture(candidates);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).endVotingPeriod();
        await expect(voting.connect(otherAccount).vote(1)).to.be.revertedWith(
            "Voting period not running!");
    })

    it ("Should correctly compute the winner of the election", async function () {
        const {voting, owner, otherAccount, anotherAccountAgain} = await deploymentFixture(candidates);
        await voting.connect(owner).startVotingPeriod();
        await voting.connect(owner).vote(0);
        await voting.connect(otherAccount).vote(1);
        await voting.connect(anotherAccountAgain).vote(1);
        await voting.connect(owner).endVotingPeriod();
        expect(BigInt((await voting.getWinner())[0])).to.equal(BigInt("1"));
    })

    it ("Should not compute the winner of the election during the voting period", async function() {
        const {voting, owner} = await deploymentFixture(candidates);
        await voting.connect(owner).startVotingPeriod();
        await expect(voting.getWinner()).to.be.revertedWith("The voting period is not finished yet!")
    })
});


