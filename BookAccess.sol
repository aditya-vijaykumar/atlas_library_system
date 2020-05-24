pragma solidity ^0.5.10;
pragma experimental ABIEncoderV2;


contract BookAccess {
    address[] users;
    address ContractOwner;
    event NewUser(uint256 NewUserID, address NewUserAddress);
    event AccessGranted(address TheUser, uint256 BookId);
    
    mapping(address => mapping(uint256 => uint256)) userBookAccess;
    
    uint256 userCounter;
    uint256 bookAccessCounter;
    
    modifier onlyOwner () {
        require(msg.sender == ContractOwner);
    _;
    }
    
    constructor() public {
        users.push(msg.sender);
        userCounter = 0;
        ContractOwner = msg.sender;
        bookAccessCounter = 0;
        
    }
    
    function GrantAccess(address User, uint256 BookID, uint256 _days) public onlyOwner returns(bool) {
        bool newEntry = true;
        for (uint i = 0; i<users.length; i++) {
            if (users[i] == User) {
                newEntry = false;
            }
        }
        if (newEntry) {
             users.push(User);
             userCounter++;
             emit NewUser(userCounter, User);
        }
        userBookAccess[User][BookID] = now + (_days * 1 days);
        bookAccessCounter++;
        emit AccessGranted(User, BookID);
        return true;
    }
    
    function getUserAccess(address User, uint256 BookID) public view returns(bool) {
        bool access = false;
        if(now < userBookAccess[User][BookID]){
            access = true;
        }
        return access;
    }
    
    function getDetails() public view onlyOwner returns (uint256 _userCounter, uint256 _bookAccessCounter)  {
        return (userCounter, bookAccessCounter);
    }
    
}