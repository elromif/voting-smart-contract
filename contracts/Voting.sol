// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct Candidate {
        uint id;
        string name;
        uint votes;
    }

    event AddedCandidate(string candidate_name);

    event CastedVote(uint candidate_id);

    mapping(uint => Candidate) id_candidate_map;

    mapping(uint => uint) candidate_votes_map;

    mapping(address => bool) address_has_voted_map;

    uint candidatesCount;

    bool isVotingPeriodRunning;

    constructor() Ownable(msg.sender) {
        candidatesCount = 0;
        isVotingPeriodRunning = false;
    }

    function getCandidate(uint id) public view returns (Candidate memory) {
        return id_candidate_map[id];
    }

    function getCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory candidates = new Candidate[](candidatesCount);
        for (uint i = 0; i < candidatesCount; i++) {
            candidates[i] = id_candidate_map[i];
        }
        return candidates;
    }

    function getCandidatesCount() public view returns (uint) {
        return candidatesCount;
    }

    function addCandidate(string calldata candidate_name) public onlyOwner {
        Candidate memory new_candidate = Candidate(
            candidatesCount,
            candidate_name,
            0
        );
        id_candidate_map[candidatesCount] = new_candidate;
        candidatesCount += 1;
        emit AddedCandidate(new_candidate.name);
    }

    function vote(uint candidate_id) public {
        require(isVotingPeriodRunning == true, "Voting period not running!");
        require(!address_has_voted_map[msg.sender], "You already voted!");
        require(
            candidate_id < candidatesCount,
            "The candidate does not exist!"
        );
        address_has_voted_map[msg.sender] = true;
        candidate_votes_map[candidate_id] += 1;
        id_candidate_map[candidate_id].votes += 1;
        emit CastedVote(candidate_id);
    }

    function getCandidateVotesCount(
        uint candidate_id
    ) public view returns (uint votes_count) {
        return candidate_votes_map[candidate_id];
    }

    function startVotingPeriod() public onlyOwner {
        for (uint i = 0; i < candidatesCount; i++) {
            candidate_votes_map[i] = 0;
        }
        isVotingPeriodRunning = true;
    }

    function endVotingPeriod() public onlyOwner {
        isVotingPeriodRunning = false;
    }

    function getWinner() public view returns (Candidate memory winner) {
        require(
            isVotingPeriodRunning == false,
            "The voting period is not finished yet!"
        );
        uint winner_id = 0;
        for (uint i = 0; i < candidatesCount; i++) {
            if (candidate_votes_map[i] > candidate_votes_map[winner_id]) {
                winner_id = i;
            }
        }
        return id_candidate_map[winner_id];
    }
}
