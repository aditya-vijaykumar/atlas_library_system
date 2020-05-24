pragma solidity ^0.5.10;
pragma experimental ABIEncoderV2;


contract Balance {
    address[] users; //Storing the list of user addresses
    address ContractOwner;
    address RevenuePool;  //Address of the wallet which will hold the revenue 
    address public assetContract; //address of the ERC20MinTable
    
    uint256 private totalCirculation;
    
    event NewUser(uint256 NewUserID, address NewUserAddress); 
    event UpdateBalance(uint256 amount, address UserAdress);
    event DeductBalance(uint256 amount, address UserAdress);
    event BurnBalance(uint256 amount, address UserAdress);
    
    mapping(address => uint256) userId; //mapping all the user address with an easy to access id
    mapping(address => uint256) userBalance; //mapping all the user address to their token balance
    
    uint256 userCounter;//to keep a track of number of users
    uint8 rate;//to set the revenue percentage being charged
    
    struct UserDatabase{
        address _address;
        uint256 balance;
    }// in case the entire list of user balances is required

    modifier onlyOwner () {
        bool found = false;
        if(ContractOwner == msg.sender)
        if (!found) {
            revert('Message sender not a participant');
        }
        _;
    }
    
    constructor(address[] memory participants, address ERCContractAddress) public {
        for (uint i=0; i<participants.length; i++) {
            users.push(participants[i]);
        }
        users.push(msg.sender);
        userCounter = 0;
        ContractOwner = msg.sender;
        RevenuePool = msg.sender;
        totalCirculation = 0;
        rate = 10;
        assetContract = ERCContractAddress;
    }
    
    function newUser(address _newUser) public onlyOwner returns (bool)  {
        bool newEntry = true;
        for (uint i = 0; i<=users.length; i++) {
            if (users[i] == _newUser) {
                newEntry = false;
                revert('User already registered');
            }
        }
        if (newEntry) {
             users.push(_newUser);
             userCounter++;
             userBalance[_newUser] = 0;
             userId[_newUser] = userCounter;
             emit NewUser(userCounter, _newUser);
        }
        return newEntry;
    }
    
    
    function UpdateBal(address User, uint256 amount) public onlyOwner returns (bool)  {
        bool newEntry = false;
        for (uint i = 0; i<=users.length; i++) {
            if (users[i] == User) {
                newEntry = true;
                break;
            }
        }
        if(!newEntry)
            revert('User Not Found');
        if(newEntry) {
            (bool success, bytes memory data) = assetContract.call(abi.encodeWithSignature("mint(address,uint256)", User, amount));
            require(success);
            userBalance[User]+=amount;
            totalCirculation+=amount;
            emit UpdateBalance(amount, User);
        }
        return newEntry;
    }

  function DeductBal(address User, uint256 amount) public onlyOwner returns (bool)  {
        bool newEntry = false;
        for (uint i = 0; i<=users.length; i++) {
            if (users[i] == User) {
                newEntry = true;
                break;
            }
        }
        if(!newEntry)
            revert('User Not Found');
        if(newEntry) {
            (bool success, bytes memory data) = assetContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", User, address(this), amount));
            require(success);
            userBalance[User]-=amount;
            totalCirculation-=amount;
            emit DeductBalance(amount, User);
        }
        return newEntry;
    }
    
    function Redirect(address Author, uint256 amount) public onlyOwner returns(bool) {
        bool completeSuccess = false;
        uint256 ALTFee; uint256 AuthorEarnings;
        ALTFee = ((amount/100)*rate);
        AuthorEarnings = (amount-ALTFee);
        (bool successOne, bytes memory dataOne) = assetContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), Author, AuthorEarnings));
            require(successOne);
        (bool successTwo, bytes memory dataTwo) = assetContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), RevenuePool, ALTFee));
            require(successTwo);
        if (successOne && successTwo)
            completeSuccess = true;
        return completeSuccess;
    }
    
    function Burn(address User, uint256 amount) public onlyOwner returns (bool)  {
        bool newEntry = false;
        for (uint i = 0; i<=users.length; i++) {
            if (users[i] == User) {
                newEntry = true;
                break;
            }
        }
        if(!newEntry)
            revert('User Not Found');
        if(newEntry) {
            userBalance[User]-=amount;
            totalCirculation-=amount;
            emit BurnBalance(amount, User);
        }
        return newEntry;
    }
    
    function setRevenue(address RevenueWallet) public onlyOwner returns (bool)  {
        RevenuePool = RevenueWallet;
        return true;
    }
    
    function setRate(uint8 newRate) public onlyOwner returns (bool)  {
        rate = newRate;
        return true;
    }
        
    function getUserBalance(address User) public view onlyOwner returns (uint256)  {
        return userBalance[User];
    }
    
    function getUserList() public view onlyOwner returns (UserDatabase[] memory)  {
        UserDatabase[] memory a = new UserDatabase[](users.length);
        for(uint256 i=0;i<users.length;i++){
            
            a[i]._address = users[i]; 
            a[i].balance = userBalance[users[i]];
        }

    }
}
