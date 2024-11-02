// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Voting
/// @notice This contract allows to setup an election, requiring voters to stake some eth into the contract to vote and allowing them to withdraw after the end of the election.
/// @notice One can start and end the election using TIMER_ROLE, and setup a new election using SETUP_ROLE

contract Voting is ReentrancyGuard, AccessControl {
    struct Candidate {
        uint256 id;
        string name;
        uint256 votes;
        address candidate_address;
    }

    event CastedVote(uint256 candidate_id);
    event stakeWithdrawn(uint256 amount);
    event votingPeriodStarted();
    event votingPeriodEnded();

    mapping(address => uint) address_amount_deposited_map;

    mapping(uint256 => mapping(address => bool)) electionVoterMap;

    Candidate[] candidates;

    bool isVotingPeriodRunning;

    bytes32 public constant TIMER_ROLE = keccak256("TIMER_ROLE");
    bytes32 public constant SETUP_ROLE = keccak256("SETUP_ROLE");

    uint256 current_election_id;

    constructor(
        string[] memory _candidate_names,
        address[] memory _candidate_addresses,
        address setuper,
        address timer
    ) {
        require(
            _candidate_names.length == _candidate_addresses.length,
            "The number of candidates and candidate addresses does not match"
        );
        isVotingPeriodRunning = false;
        _grantRole(DEFAULT_ADMIN_ROLE, setuper);
        _grantRole(SETUP_ROLE, setuper);
        _grantRole(TIMER_ROLE, timer);
        for (uint256 i = 0; i < _candidate_names.length; i++) {
            candidates.push(
                Candidate({
                    id: i,
                    name: _candidate_names[i],
                    votes: 0,
                    candidate_address: _candidate_addresses[i]
                })
            );
        }
        current_election_id = 0;
    }

    function getCandidate(uint256 id) public view returns (Candidate memory) {
        require(id >= 0 && id < candidates.length, "Wrong candidate id!");
        return candidates[id];
    }

    function getCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getcandidatesCount() public view returns (uint256) {
        return candidates.length;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function startVotingPeriod() public {
        require(hasRole(TIMER_ROLE, msg.sender), "Caller is not a timer");
        isVotingPeriodRunning = true;
        emit votingPeriodStarted();
    }

    function vote(uint256 candidate_id) public payable nonReentrant {
        require(isVotingPeriodRunning == true, "Voting period not running!");
        require(
            !electionVoterMap[current_election_id][msg.sender],
            "You already voted!"
        );
        require(
            candidate_id < candidates.length,
            "The candidate does not exist!"
        );
        require(msg.value > 0, "You have to stake eth to vote !");
        address_amount_deposited_map[msg.sender] = msg.value;
        electionVoterMap[current_election_id][msg.sender] = true;
        candidates[candidate_id].votes += 1;
        emit CastedVote(candidate_id);
    }

    function getVotingPeriodStatus() public view returns (bool) {
        return isVotingPeriodRunning;
    }

    function getCandidateVotesCount(
        uint256 candidate_id
    ) public view returns (uint256 votes_count) {
        return candidates[candidate_id].votes;
    }

    function endVotingPeriod() public {
        require(hasRole(TIMER_ROLE, msg.sender), "Caller is not a timer");
        isVotingPeriodRunning = false;
        emit votingPeriodEnded();
    }

    function getWinner() public view returns (Candidate memory winner) {
        require(
            isVotingPeriodRunning == false,
            "The voting period is not finished yet!"
        );
        uint256 winner_id = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].votes > candidates[winner_id].votes) {
                winner_id = i;
            }
        }
        return candidates[winner_id];
    }

    function withdrawStake() public nonReentrant {
        require(!isVotingPeriodRunning, "Voting period not finished yet!");
        require(
            address_amount_deposited_map[msg.sender] > 0,
            "stake already withdrawn!"
        );
        uint256 amount = address_amount_deposited_map[msg.sender];
        address_amount_deposited_map[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to withdraw stake");
        emit stakeWithdrawn(amount);
    }

    function startNewElection(
        string[] memory candidate_names,
        address[] memory candidate_addresses
    ) public {
        require(hasRole(SETUP_ROLE, msg.sender), "Caller is not a setuper!");
        require(
            candidate_names.length == candidate_addresses.length,
            "The number of candidates and candidate addresses does not match"
        );
        require(!isVotingPeriodRunning, "Current election not finished!");
        delete candidates;
        for (uint i = 0; i < candidate_names.length; i++) {
            candidates.push(
                Candidate({
                    id: i,
                    name: candidate_names[i],
                    votes: 0,
                    candidate_address: candidate_addresses[i]
                })
            );
        }
    }
}
