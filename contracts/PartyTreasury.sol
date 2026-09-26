// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PartyTreasury
 * @notice Multi-party verifiable onchain group treasury on Monad Testnet.
 * @dev Supports native MON deposits, host-approved social rewards, expense reimbursements,
 * peer-to-peer debt settlements, and inter-party rollovers.
 */
contract PartyTreasury {
    struct PartyPot {
        address host;
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalDistributed;
        bool exists;
    }

    address public immutable owner;
    uint256 private _locked = 1;

    // Mapping from partyId (keccak256 hash of party UUID/slug) to PartyPot
    mapping(bytes32 => PartyPot) public parties;
    // Mapping from partyId => member address => total deposited
    mapping(bytes32 => mapping(address => uint256)) public memberBalances;

    event PartyRegistered(bytes32 indexed partyId, address indexed host);
    event Deposited(bytes32 indexed partyId, address indexed member, uint256 amount, uint256 newBalance);
    event RewardDistributed(bytes32 indexed partyId, address indexed recipient, uint256 amount, string role);
    event ReimbursementClaimed(bytes32 indexed partyId, address indexed member, uint256 amount, string description);
    event DebtSettled(bytes32 indexed partyId, address indexed debtor, address indexed creditor, uint256 amount);
    event BalanceRolledOver(bytes32 indexed fromPartyId, bytes32 indexed toPartyId, uint256 amount);

    modifier nonReentrant() {
        require(_locked == 1, "REENTRANCY_GUARD");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier onlyHostOrOwner(bytes32 partyId) {
        address partyHost = parties[partyId].host;
        require(
            msg.sender == partyHost || msg.sender == owner,
            "Only party host or contract owner authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register a party and define its host.
     */
    function registerParty(bytes32 partyId, address host) external {
        require(host != address(0), "Invalid host address");
        require(!parties[partyId].exists, "Party already registered");

        parties[partyId] = PartyPot({
            host: host,
            balance: 0,
            totalDeposited: 0,
            totalDistributed: 0,
            exists: true
        });

        emit PartyRegistered(partyId, host);
    }

    /**
     * @notice Deposit native MON into a specific party pot.
     */
    function deposit(bytes32 partyId) public payable nonReentrant {
        require(msg.value > 0, "Deposit must be > 0");

        PartyPot storage pot = parties[partyId];
        if (!pot.exists) {
            pot.host = msg.sender;
            pot.exists = true;
            emit PartyRegistered(partyId, msg.sender);
        }

        pot.balance += msg.value;
        pot.totalDeposited += msg.value;
        memberBalances[partyId][msg.sender] += msg.value;

        emit Deposited(partyId, msg.sender, msg.value, pot.balance);
    }

    /**
     * @notice Distribute an economic reward for social contributions (DJ, challenges, trivia).
     */
    function distributeReward(
        bytes32 partyId,
        address payable recipient,
        uint256 amount,
        string calldata role
    ) external nonReentrant onlyHostOrOwner(partyId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        PartyPot storage pot = parties[partyId];
        require(pot.balance >= amount, "Insufficient treasury balance");

        pot.balance -= amount;
        pot.totalDistributed += amount;

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Reward transfer failed");

        emit RewardDistributed(partyId, recipient, amount, role);
    }

    /**
     * @notice Execute an approved expense reimbursement from the shared party pot.
     */
    function executeReimbursement(
        bytes32 partyId,
        address payable member,
        uint256 amount,
        string calldata description
    ) external nonReentrant onlyHostOrOwner(partyId) {
        require(member != address(0), "Invalid member address");
        require(amount > 0, "Amount must be > 0");

        PartyPot storage pot = parties[partyId];
        require(pot.balance >= amount, "Insufficient treasury balance");

        pot.balance -= amount;
        pot.totalDistributed += amount;

        (bool sent, ) = member.call{value: amount}("");
        require(sent, "Reimbursement transfer failed");

        emit ReimbursementClaimed(partyId, member, amount, description);
    }

    /**
     * @notice Settle peer-to-peer debts directly between members using native MON.
     */
    function settleDebt(
        bytes32 partyId,
        address payable creditor
    ) external payable nonReentrant {
        require(msg.value > 0, "Payment must be > 0");
        require(creditor != address(0), "Invalid creditor");
        require(creditor != msg.sender, "Cannot settle debt with yourself");

        (bool sent, ) = creditor.call{value: msg.value}("");
        require(sent, "Debt settlement transfer failed");

        emit DebtSettled(partyId, msg.sender, creditor, msg.value);
    }

    /**
     * @notice Roll over remaining funds to the next party pot.
     */
    function rolloverToNextParty(
        bytes32 fromPartyId,
        bytes32 toPartyId
    ) external nonReentrant onlyHostOrOwner(fromPartyId) {
        require(fromPartyId != toPartyId, "Cannot rollover to same party");
        PartyPot storage sourcePot = parties[fromPartyId];
        uint256 remaining = sourcePot.balance;
        require(remaining > 0, "No funds to rollover");

        sourcePot.balance = 0;

        PartyPot storage destPot = parties[toPartyId];
        if (!destPot.exists) {
            destPot.host = sourcePot.host;
            destPot.exists = true;
            emit PartyRegistered(toPartyId, sourcePot.host);
        }

        destPot.balance += remaining;
        destPot.totalDeposited += remaining;

        emit BalanceRolledOver(fromPartyId, toPartyId, remaining);
    }

    /**
     * @notice Get party pot summary.
     */
    function getParty(bytes32 partyId)
        external
        view
        returns (
            address host,
            uint256 balance,
            uint256 totalDeposited,
            uint256 totalDistributed,
            bool exists
        )
    {
        PartyPot memory pot = parties[partyId];
        return (pot.host, pot.balance, pot.totalDeposited, pot.totalDistributed, pot.exists);
    }

    receive() external payable {
        // Fallback accepts MON
    }
}
