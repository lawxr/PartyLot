// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PartyTreasury (v2 Architecture)
 * @notice Multi-party verifiable onchain group treasury on Monad.
 * @dev Supports native MON & ERC-20 deposits, canonical host authority binding,
 * host-approved social rewards, expense reimbursements, peer-to-peer debt settlements,
 * conserved pro-rata participant refunds, and inter-party rollovers.
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

    // Mapping from partyId => ERC20 token => balance
    mapping(bytes32 => mapping(address => uint256)) public tokenBalances;

    // Events
    event PartyRegistered(bytes32 indexed partyId, address indexed host);
    event Deposited(bytes32 indexed partyId, address indexed member, uint256 amount, uint256 newBalance);
    event RewardDistributed(bytes32 indexed partyId, address indexed recipient, uint256 amount, string role);
    event ReimbursementClaimed(bytes32 indexed partyId, address indexed member, uint256 amount, string description);
    event DebtSettled(bytes32 indexed partyId, address indexed debtor, address indexed creditor, uint256 amount);
    event BalanceRolledOver(bytes32 indexed fromPartyId, bytes32 indexed toPartyId, uint256 amount);
    event ParticipantRefunded(bytes32 indexed partyId, address indexed participant, uint256 refundAmount);
    event PartyClosed(bytes32 indexed partyId, address indexed host, uint256 remainingWithdrawn);
    event TokenDeposited(bytes32 indexed partyId, address indexed token, address indexed member, uint256 amount);
    event TokenDistributed(bytes32 indexed partyId, address indexed token, address indexed recipient, uint256 amount);

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register a party and define its host.
     * @dev Restricted to contract owner (relayer) to bind canonical party host authority.
     */
    function registerParty(bytes32 partyId, address host) external onlyOwner {
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
     * @dev Requires the party to be explicitly registered by the canonical authority.
     */
    function deposit(bytes32 partyId) public payable nonReentrant {
        require(msg.value > 0, "Deposit must be > 0");

        PartyPot storage pot = parties[partyId];
        require(pot.exists, "Party not registered");

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
     * @notice Claim a proportional refund of remaining party pot balance based on contribution ratio.
     * @dev Conserves remaining pot across arbitrary claim orders by dynamically adjusting denominator pool.
     */
    function claimProRataRefund(bytes32 partyId) external nonReentrant {
        PartyPot storage pot = parties[partyId];
        require(pot.exists, "Party does not exist");
        require(pot.balance > 0, "No remaining balance in pot");

        uint256 userDeposited = memberBalances[partyId][msg.sender];
        require(userDeposited > 0, "No contribution to refund");
        require(pot.totalDeposited > 0, "Zero total deposits");

        // Pro-rata share of remaining balance with conserved denominator tracking
        uint256 refundAmount;
        if (userDeposited >= pot.totalDeposited) {
            refundAmount = pot.balance;
            pot.totalDeposited = 0;
        } else {
            refundAmount = (userDeposited * pot.balance) / pot.totalDeposited;
            pot.totalDeposited -= userDeposited;
        }
        require(refundAmount > 0, "Refund amount too small");

        memberBalances[partyId][msg.sender] = 0;
        pot.balance -= refundAmount;

        (bool sent, ) = payable(msg.sender).call{value: refundAmount}("");
        require(sent, "Refund transfer failed");

        emit ParticipantRefunded(partyId, msg.sender, refundAmount);
    }

    /**
     * @notice Close party and sweep any remaining funds to a designated recipient/crew wallet.
     */
    function closePartyAndWithdrawRemaining(
        bytes32 partyId,
        address payable recipient
    ) external nonReentrant onlyHostOrOwner(partyId) {
        require(recipient != address(0), "Invalid recipient");
        PartyPot storage pot = parties[partyId];
        require(pot.exists, "Party does not exist");
        uint256 remaining = pot.balance;
        require(remaining > 0, "No remaining balance");

        pot.balance = 0;
        (bool sent, ) = recipient.call{value: remaining}("");
        require(sent, "Withdrawal failed");

        emit PartyClosed(partyId, msg.sender, remaining);
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
        require(sourcePot.exists, "Source party does not exist");
        uint256 remaining = sourcePot.balance;
        require(remaining > 0, "No funds to rollover");

        sourcePot.balance = 0;

        PartyPot storage destPot = parties[toPartyId];
        require(destPot.exists, "Destination party not registered");
        require(destPot.host == sourcePot.host || msg.sender == owner, "Destination host mismatch");

        destPot.balance += remaining;
        destPot.totalDeposited += remaining;

        emit BalanceRolledOver(fromPartyId, toPartyId, remaining);
    }

    /**
     * @notice Deposit standard ERC-20 token (e.g. USDC) into party pot.
     * @dev Requires the party to be explicitly registered by the canonical authority.
     */
    function depositToken(
        bytes32 partyId,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be > 0");

        PartyPot storage pot = parties[partyId];
        require(pot.exists, "Party not registered");

        tokenBalances[partyId][token] += amount;

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");

        emit TokenDeposited(partyId, token, msg.sender, amount);
    }

    /**
     * @notice Distribute an ERC-20 token reward from party pot.
     */
    function distributeTokenReward(
        bytes32 partyId,
        address token,
        address recipient,
        uint256 amount
    ) external nonReentrant onlyHostOrOwner(partyId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(tokenBalances[partyId][token] >= amount, "Insufficient token balance");

        tokenBalances[partyId][token] -= amount;

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", recipient, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");

        emit TokenDistributed(partyId, token, recipient, amount);
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

    /**
     * @notice Get deposited balance of a member in a party pot.
     */
    function getMemberBalance(bytes32 partyId, address member) external view returns (uint256) {
        return memberBalances[partyId][member];
    }

    receive() external payable {
        // Fallback accepts MON
    }
}
