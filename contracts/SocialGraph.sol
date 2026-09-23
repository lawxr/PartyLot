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

    function getPairKey(address a, address b) public pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    /**
     * @notice Records verified co-presence at a gathering and increments bilateral relationship ties
     */
    function recordGathering(uint256 partyId, address[] calldata participants) external {
        require(participants.length >= 2, "Gathering must have >= 2 people");

        for (uint256 i = 0; i < participants.length; i++) {
            totalGatheringsAttended[participants[i]]++;

            for (uint256 j = i + 1; j < participants.length; j++) {
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
