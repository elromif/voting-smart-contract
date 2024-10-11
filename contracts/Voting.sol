// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    struct Candidate {
        uint id;
        string name;
        uint votes;
        address candidate_address;
    }

    event CastedVote(uint candidate_id);

    mapping(address => bool) address_has_voted_map;

    mapping(uint => Candidate) id_candidate_map;

    uint candidatesCount;

    bool isVotingPeriodRunning;

    constructor(
        string[] memory _candidate_names,
        address[] memory _candidate_addresses
    ) Ownable(msg.sender) {
        candidatesCount = _candidate_names.length;
        isVotingPeriodRunning = false;

        for (uint i = 0; i < _candidate_names.length; i++)
            id_candidate_map[i] = Candidate(
                i,
                _candidate_names[i],
                0,
                _candidate_addresses[i]
            );
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

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function vote(uint candidate_id) public payable {
        require(isVotingPeriodRunning == true, "Voting period not running!");
        require(!address_has_voted_map[msg.sender], "You already voted!");
        require(
            candidate_id < candidatesCount,
            "The candidate does not exist!"
        );
        require(
            msg.value > 0,
            "You should contribute to the election's nest egg to vote !"
        );
        address_has_voted_map[msg.sender] = true;
        id_candidate_map[candidate_id].votes += 1;
        emit CastedVote(candidate_id);
    }

    function getCandidateVotesCount(
        uint candidate_id
    ) public view returns (uint votes_count) {
        return id_candidate_map[candidate_id].votes;
    }

    function startVotingPeriod() public onlyOwner {
        isVotingPeriodRunning = true;
    }

    function endVotingPeriod() public onlyOwner {
        isVotingPeriodRunning = false;
        address payable winner = payable(getWinner().candidate_address);
        (bool sent, ) = winner.call{value: address(this).balance}("");
        require(sent, "Failed to send the nest egg to the winner");
    }

    function getVotingPeriodStatus() public view returns (bool) {
        return isVotingPeriodRunning;
    }

    function getWinner() public view returns (Candidate memory winner) {
        require(
            isVotingPeriodRunning == false,
            "The voting period is not finished yet!"
        );
        uint winner_id = 0;
        for (uint i = 0; i < candidatesCount; i++) {
            if (id_candidate_map[i].votes > id_candidate_map[winner_id].votes) {
                winner_id = i;
            }
        }
        return id_candidate_map[winner_id];
    }

    function congratulateWinner() public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        address payable winner = payable(getWinner().candidate_address);
        (bool sent, ) = winner.call{value: msg.value}("");
        require(sent, "Failed to send Ether to the winner");
    }
}
