// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PartyRegistry
 * @notice EIP-712 cryptographic invite verification and party membership registry on Monad.
 * @dev Protects against brute-force attacks on short 4-character invite codes (8F4K).
 * Short codes are only resolved offchain by an authorized relayer which produces a signed EIP-712 permit.
 */
contract PartyRegistry {
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "InvitePermit(address guest,uint256 partyId,uint256 deadline,uint256 nonce)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;
    address public immutable partySigner; // Authorized signer/host for permits

    struct PartyData {
        address host;
        string title;
        uint256 createdAt;
        uint256 memberCount;
        address treasuryContract;
    }

    mapping(uint256 => PartyData) public parties;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(address => uint256) public nonces;

    event PartyCreated(uint256 indexed partyId, address indexed host, string title, address treasury);
    event MemberJoined(uint256 indexed partyId, address indexed guest, uint256 totalMembers);

    constructor(address _partySigner) {
        partySigner = _partySigner;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Partylot")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Register a newly created party
     */
    function registerParty(uint256 partyId, string calldata title, address treasury) external {
        require(parties[partyId].host == address(0), "Party already exists");
        parties[partyId] = PartyData({
            host: msg.sender,
            title: title,
            createdAt: block.timestamp,
            memberCount: 1,
            treasuryContract: treasury
        });
        isMember[partyId][msg.sender] = true;

        emit PartyCreated(partyId, msg.sender, title, treasury);
    }

    /**
     * @notice Join a party using an EIP-712 cryptographic permit generated from the human invite code.
     * Prevents short-code brute force attacks because verification requires a cryptographic signature.
     */
    function joinPartyWithPermit(
        uint256 partyId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Invite permit has expired");
        require(!isMember[partyId][msg.sender], "Already a member");
        require(parties[partyId].host != address(0), "Party does not exist");

        uint256 currentNonce = nonces[msg.sender]++;

        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, msg.sender, partyId, deadline, currentNonce)
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address recovered = recoverSigner(digest, signature);
        require(recovered == partySigner || recovered == parties[partyId].host, "Invalid invite permit signature");

        isMember[partyId][msg.sender] = true;
        parties[partyId].memberCount++;

        emit MemberJoined(partyId, msg.sender, parties[partyId].memberCount);
    }

    function recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Malformed signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        return ecrecover(digest, v, r, s);
    }
}
