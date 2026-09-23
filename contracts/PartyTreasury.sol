// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PartyTreasury
 * @notice Verifiable onchain group treasury for Partylot gatherings.
 * @dev Supports member deposits, sponsored reimbursements, contribution rewards (DJ, Ice, Challenges),
 * and automatic rollover into subsequent crew gatherings. Compatible with ERC-4337 Account Abstraction.
 */
contract PartyTreasury {
    struct ContributionReward {
        address recipient;
        uint256 amount;
        string role; // e.g. "OFFICIAL_DJ", "ICE_RUNNER", "TRIVIA_WINNER"
        uint256 timestamp;
    }

    struct Reimbursement {
        address paidBy;
        uint256 amount;
        string description;
        bool executed;
    }

    address public immutable host;
    uint256 public immutable partyId;
    uint256 public totalDeposited;
    uint256 public totalDistributed;
    uint256 public rolloverBalance;

    mapping(address => uint256) public memberBalances;
    ContributionReward[] public rewards;
    Reimbursement[] public reimbursements;

    event Deposited(address indexed member, uint256 amount, uint256 newBalance);
    event ReimbursementClaimed(address indexed member, uint256 amount, string description);
    event RewardDistributed(address indexed recipient, uint256 amount, string role);
    event BalanceRolledOver(uint256 amount, uint256 nextPartyId);

    modifier onlyHost() {
        require(msg.sender == host, "Only party host can authorize");
        _;
    }

    constructor(uint256 _partyId, address _host) payable {
        partyId = _partyId;
        host = _host;
        if (msg.value > 0) {
            totalDeposited += msg.value;
            memberBalances[_host] += msg.value;
            emit Deposited(_host, msg.value, msg.value);
        }
    }

    /**
     * @notice Deposit funds into the shared party pot.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit must be > 0");
        memberBalances[msg.sender] += msg.value;
        totalDeposited += msg.value;

        emit Deposited(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @notice Distribute an economic reward for social contribution (DJ, winner, supplies).
     */
    function distributeReward(
        address payable recipient,
        uint256 amount,
        string calldata role
    ) external onlyHost {
        require(amount <= address(this).balance, "Insufficient treasury balance");
        require(recipient != address(0), "Invalid recipient");

        rewards.push(ContributionReward({
            recipient: recipient,
            amount: amount,
            role: role,
            timestamp: block.timestamp
        }));

        totalDistributed += amount;
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Reward transfer failed");

        emit RewardDistributed(recipient, amount, role);
    }

    /**
     * @notice Execute an approved expense reimbursement from the shared pot.
     */
    function executeReimbursement(
        address payable member,
        uint256 amount,
        string calldata description
    ) external onlyHost {
        require(amount <= address(this).balance, "Insufficient treasury balance");

        reimbursements.push(Reimbursement({
            paidBy: member,
            amount: amount,
            description: description,
            executed: true
        }));

        totalDistributed += amount;
        (bool sent, ) = member.call{value: amount}("");
        require(sent, "Reimbursement transfer failed");

        emit ReimbursementClaimed(member, amount, description);
    }

    /**
     * @notice Roll over remaining funds to the next party treasury contract.
     */
    function rolloverToNextParty(address payable nextTreasury, uint256 nextPartyId) external onlyHost {
        uint256 remaining = address(this).balance;
        require(remaining > 0, "No funds to rollover");

        rolloverBalance = remaining;
        (bool sent, ) = nextTreasury.call{value: remaining}("");
        require(sent, "Rollover transfer failed");

        emit BalanceRolledOver(remaining, nextPartyId);
    }

    receive() external payable {
        deposit();
    }
}
