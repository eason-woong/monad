// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vote
 * @dev A decentralized voting system for property management committees
 * Supports proposal creation with whitelist verification and transparent voting
 */
contract Vote is Ownable, ReentrancyGuard {
    // Counter for proposal IDs
    uint256 private _proposalIds;
    
    // Voting options
    enum VoteOption { AGREE, DISAGREE, ABSTAIN, FOLLOW_MAJORITY }
    
    // Proposal status
    enum ProposalStatus { ACTIVE, CLOSED, EXECUTED }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        string title;
        string content;
        string diffContent; // 变更diff内容
        address creator;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        uint256 totalVotes;
        mapping(VoteOption => uint256) voteCounts;
        mapping(address => bool) hasVoted;
        mapping(address => VoteOption) voterChoices;
        address[] voters;
    }
    
    // Whitelist structure for each proposal
    struct ProposalWhitelist {
        mapping(address => bool) isWhitelisted;
        address[] whitelistedAddresses;
        uint256 totalWhitelisted;
    }
    
    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => ProposalWhitelist) private proposalWhitelists;
    mapping(address => bool) public isCommitteeMember; // 业委会成员
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address indexed creator,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteOption option
    );
    
    event ProposalClosed(uint256 indexed proposalId, ProposalStatus status);
    
    event WhitelistUpdated(uint256 indexed proposalId, address indexed user, bool status);
    
    event CommitteeMemberUpdated(address indexed member, bool status);
    
    // Modifiers
    modifier onlyCommittee() {
        _onlyCommittee();
        _;
    }
    
    modifier onlyWhitelisted(uint256 proposalId) {
        _onlyWhitelisted(proposalId);
        _;
    }
    
    modifier proposalExists(uint256 proposalId) {
        _proposalExists(proposalId);
        _;
    }
    
    modifier proposalActive(uint256 proposalId) {
        _proposalActive(proposalId);
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    // Internal functions for modifiers
    function _onlyCommittee() internal view {
        require(isCommitteeMember[msg.sender] || msg.sender == owner(), "Only committee members can perform this action");
    }
    
    function _onlyWhitelisted(uint256 proposalId) internal view {
        require(proposalWhitelists[proposalId].isWhitelisted[msg.sender], "Address not whitelisted for this proposal");
    }
    
    function _proposalExists(uint256 proposalId) internal view {
        require(proposalId > 0 && proposalId <= _proposalIds, "Proposal does not exist");
    }
    
    function _proposalActive(uint256 proposalId) internal view {
        require(proposals[proposalId].status == ProposalStatus.ACTIVE, "Proposal is not active");
        require(block.timestamp >= proposals[proposalId].startTime, "Voting has not started");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting has ended");
    }
    
    /**
     * @dev Add or remove committee member
     * @param member Address of the committee member
     * @param status True to add, false to remove
     */
    function setCommitteeMember(address member, bool status) external onlyOwner {
        isCommitteeMember[member] = status;
        emit CommitteeMemberUpdated(member, status);
    }
    
    /**
     * @dev Create a new proposal with whitelist
     * @param title Proposal title
     * @param content Proposal content
     * @param diffContent Change diff content
     * @param duration Voting duration in seconds
     * @param whitelistedAddresses Array of addresses allowed to vote
     */
    function createProposal(
        string memory title,
        string memory content,
        string memory diffContent,
        uint256 duration,
        address[] memory whitelistedAddresses
    ) external onlyCommittee returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(content).length > 0, "Content cannot be empty");
        require(duration > 0, "Duration must be greater than 0");
        require(whitelistedAddresses.length > 0, "Must have at least one whitelisted address");
        
        _proposalIds++;
        uint256 proposalId = _proposalIds;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.title = title;
        newProposal.content = content;
        newProposal.diffContent = diffContent;
        newProposal.creator = msg.sender;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + duration;
        newProposal.status = ProposalStatus.ACTIVE;
        
        // Set up whitelist for this proposal
        ProposalWhitelist storage whitelist = proposalWhitelists[proposalId];
        for (uint256 i = 0; i < whitelistedAddresses.length; i++) {
            address addr = whitelistedAddresses[i];
            if (!whitelist.isWhitelisted[addr]) {
                whitelist.isWhitelisted[addr] = true;
                whitelist.whitelistedAddresses.push(addr);
                whitelist.totalWhitelisted++;
            }
        }
        
        emit ProposalCreated(proposalId, title, msg.sender, newProposal.startTime, newProposal.endTime);
        
        return proposalId;
    }
    
    /**
     * @dev Add address to proposal whitelist
     * @param proposalId The proposal ID
     * @param user Address to add to whitelist
     */
    function addToWhitelist(uint256 proposalId, address user) external onlyCommittee proposalExists(proposalId) {
        require(!proposalWhitelists[proposalId].isWhitelisted[user], "Address already whitelisted");
        
        proposalWhitelists[proposalId].isWhitelisted[user] = true;
        proposalWhitelists[proposalId].whitelistedAddresses.push(user);
        proposalWhitelists[proposalId].totalWhitelisted++;
        
        emit WhitelistUpdated(proposalId, user, true);
    }
    
    /**
     * @dev Remove address from proposal whitelist
     * @param proposalId The proposal ID
     * @param user Address to remove from whitelist
     */
    function removeFromWhitelist(uint256 proposalId, address user) external onlyCommittee proposalExists(proposalId) {
        require(proposalWhitelists[proposalId].isWhitelisted[user], "Address not whitelisted");
        
        proposalWhitelists[proposalId].isWhitelisted[user] = false;
        proposalWhitelists[proposalId].totalWhitelisted--;
        
        emit WhitelistUpdated(proposalId, user, false);
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId The proposal ID
     * @param option The voting option
     * @param comment Optional comment for the vote
     */
    function vote(
        uint256 proposalId,
        VoteOption option,
        string memory comment
    ) external proposalExists(proposalId) proposalActive(proposalId) onlyWhitelisted(proposalId) nonReentrant {
        require(!proposals[proposalId].hasVoted[msg.sender], "Already voted on this proposal");
        
        Proposal storage proposal = proposals[proposalId];
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voterChoices[msg.sender] = option;
        proposal.voteCounts[option]++;
        proposal.totalVotes++;
        proposal.voters.push(msg.sender);
        
        emit VoteCast(proposalId, msg.sender, option);
    }
    
    /**
     * @dev Close a proposal
     * @param proposalId The proposal ID
     */
    function closeProposal(uint256 proposalId) external onlyCommittee proposalExists(proposalId) {
        require(proposals[proposalId].status == ProposalStatus.ACTIVE, "Proposal is not active");
        
        proposals[proposalId].status = ProposalStatus.CLOSED;
        emit ProposalClosed(proposalId, ProposalStatus.CLOSED);
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId The proposal ID
     */
    function getProposal(uint256 proposalId) external view proposalExists(proposalId) returns (
        uint256 id,
        string memory title,
        string memory content,
        string memory diffContent,
        address creator,
        uint256 startTime,
        uint256 endTime,
        ProposalStatus status,
        uint256 totalVotes
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.content,
            proposal.diffContent,
            proposal.creator,
            proposal.startTime,
            proposal.endTime,
            proposal.status,
            proposal.totalVotes
        );
    }
    
    /**
     * @dev Get vote counts for a proposal
     * @param proposalId The proposal ID
     */
    function getVoteCounts(uint256 proposalId) external view proposalExists(proposalId) returns (
        uint256 agree,
        uint256 disagree,
        uint256 abstain,
        uint256 followMajority
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.voteCounts[VoteOption.AGREE],
            proposal.voteCounts[VoteOption.DISAGREE],
            proposal.voteCounts[VoteOption.ABSTAIN],
            proposal.voteCounts[VoteOption.FOLLOW_MAJORITY]
        );
    }
    
    /**
     * @dev Get voter's choice
     * @param proposalId The proposal ID
     * @param voter The voter's address
     */
    function getVoterChoice(uint256 proposalId, address voter) external view proposalExists(proposalId) returns (
        bool hasVoted,
        VoteOption choice
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.hasVoted[voter],
            proposal.voterChoices[voter]
        );
    }
    
    /**
     * @dev Get all voters for a proposal
     * @param proposalId The proposal ID
     */
    function getVoters(uint256 proposalId) external view proposalExists(proposalId) returns (address[] memory) {
        return proposals[proposalId].voters;
    }
    
    /**
     * @dev Check if address is whitelisted for a proposal
     * @param proposalId The proposal ID
     * @param user The address to check
     */
    function isWhitelisted(uint256 proposalId, address user) external view proposalExists(proposalId) returns (bool) {
        return proposalWhitelists[proposalId].isWhitelisted[user];
    }
    
    /**
     * @dev Get whitelisted addresses for a proposal
     * @param proposalId The proposal ID
     */
    function getWhitelistedAddresses(uint256 proposalId) external view proposalExists(proposalId) returns (address[] memory) {
        return proposalWhitelists[proposalId].whitelistedAddresses;
    }
    
    /**
     * @dev Get total number of whitelisted addresses for a proposal
     * @param proposalId The proposal ID
     */
    function getWhitelistCount(uint256 proposalId) external view proposalExists(proposalId) returns (uint256) {
        return proposalWhitelists[proposalId].totalWhitelisted;
    }
    
    /**
     * @dev Get current proposal ID counter
     */
    function getCurrentProposalId() external view returns (uint256) {
        return _proposalIds;
    }
    
    /**
     * @dev Get proposal count
     */
    function getProposalCount() external view returns (uint256) {
        return _proposalIds;
    }
    
    /**
     * @dev Get proposal vote statistics
     * @param proposalId The proposal ID
     */
    function getProposalVoteStats(uint256 proposalId) external view proposalExists(proposalId) returns (
        uint256[4] memory voteCounts
    ) {
        Proposal storage proposal = proposals[proposalId];
        voteCounts[0] = proposal.voteCounts[VoteOption.AGREE];
        voteCounts[1] = proposal.voteCounts[VoteOption.DISAGREE];
        voteCounts[2] = proposal.voteCounts[VoteOption.ABSTAIN];
        voteCounts[3] = proposal.voteCounts[VoteOption.FOLLOW_MAJORITY];
        return voteCounts;
    }
    
    /**
     * @dev Get all proposal voters
     * @param proposalId The proposal ID
     */
    function getProposalVoters(uint256 proposalId) external view proposalExists(proposalId) returns (address[] memory) {
        return proposals[proposalId].voters;
    }
    
    /**
     * @dev Check if user has voted on a proposal
     * @param proposalId The proposal ID
     * @param user The user's address
     */
    function hasVoted(uint256 proposalId, address user) external view proposalExists(proposalId) returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }
    
    /**
     * @dev Get voter's choice for a proposal
     * @param proposalId The proposal ID
     * @param voter The voter's address
     */
    function getVoterChoice(uint256 proposalId, address voter) external view proposalExists(proposalId) returns (VoteOption) {
        require(proposals[proposalId].hasVoted[voter], "User has not voted");
        return proposals[proposalId].voterChoices[voter];
    }
}
