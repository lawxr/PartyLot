// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SocialGraph
 * @notice Portable shared-experience graph for private party crews on Monad.
 * @dev Replaces vanity follower counts with verifiable real-world co-presence ("12 nights together").
 * Keeps private media and location offchain, preserving portable group ownership and social attestations.
 */
contract SocialGraph {
    struct Crew {
        string name;
        address host;
        uint256 createdAt;
        uint256 totalGatherings;
    }

    address public immutable owner;
    address public authorizedRegistry;

    // Mapping from sorted address pair hash -> number of gatherings attended together
    mapping(bytes32 => uint256) public sharedNightsCount;

    // Mapping from user -> total verified gatherings
    mapping(address => uint256) public totalGatheringsAttended;

    // Crew ID -> Crew details
    mapping(uint256 => Crew) public crews;
    mapping(uint256 => mapping(address => bool)) public isCrewMember;

    event GatheringRecorded(uint256 indexed partyId, uint256 participantsCount);
    event CrewCreated(uint256 indexed crewId, string name, address indexed host);
    event SocialTiesUpdated(address indexed userA, address indexed userB, uint256 totalShared);
    event AuthorizedRegistryUpdated(address indexed registry);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    modifier onlyOwnerOrRegistry() {
        require(
            msg.sender == owner || (authorizedRegistry != address(0) && msg.sender == authorizedRegistry),
            "Unauthorized social graph recorder"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setAuthorizedRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Invalid registry address");
        authorizedRegistry = _registry;
        emit AuthorizedRegistryUpdated(_registry);
    }

    function getPairKey(address a, address b) public pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    /**
     * @notice Records verified co-presence at a gathering and increments bilateral relationship ties
     * @dev Restricted to contract owner (relayer) or authorized registry to prevent Sybil graph manipulation.
     * Bounded to a maximum of 30 participants per gathering to prevent quadratic O(N^2) gas explosion.
     */
    function recordGathering(uint256 partyId, address[] calldata participants) external onlyOwnerOrRegistry {
        require(participants.length >= 2, "Gathering must have >= 2 people");
        require(participants.length <= 30, "Participants count exceeds max batch limit (30)");

        for (uint256 i = 0; i < participants.length; i++) {
            require(participants[i] != address(0), "Invalid participant address");
            totalGatheringsAttended[participants[i]]++;

            for (uint256 j = i + 1; j < participants.length; j++) {
                require(participants[j] != address(0), "Invalid participant address");
                bytes32 pairKey = getPairKey(participants[i], participants[j]);
                sharedNightsCount[pairKey]++;
                emit SocialTiesUpdated(participants[i], participants[j], sharedNightsCount[pairKey]);
            }
        }

        emit GatheringRecorded(partyId, participants.length);
    }

    /**
     * @notice Returns the number of nights two users have partied together
     */
    function getNightsTogether(address a, address b) external view returns (uint256) {
        return sharedNightsCount[getPairKey(a, b)];
    }
}
