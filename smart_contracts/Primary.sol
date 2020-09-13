pragma solidity ^0.5.10;
pragma experimental ABIEncoderV2;


contract Primary {
    address[] users; //Storing the list of user addresses
    address ContractOwner;
    address RevenuePool;  //Address of the wallet which will hold the revenue 
    address public assetContract; //address of the ERC20MinTable
    
    event NewUser(uint256 NewUserID, address NewUserAddress); 
    event UpdateBalance(uint256 amount, address UserAdress);
    event DeductBalance(uint256 amount, address UserAdress);
    event WithdrawEarnings(uint256 amount, address UserAdress);
    
    mapping(address => uint256) authorBalance; //mapping all the author address to their earnings
   
    uint256 revenue; //to keep track of the balance of Primary contract
    uint256 userCounter;//to keep a track of number of users
    uint8 rate;//to set the revenue percentage being charged
    
    struct UserDatabase{
        address _address;
        uint256 balance;
    }// in case the entire list of user balances is required

    modifier onlyOwner () {
        require(msg.sender == ContractOwner);
    _;
    }
    
    constructor(address ERCContractAddress) public {
        users.push(msg.sender);
        userCounter = 0;
        revenue = 0;
        ContractOwner = msg.sender;
        RevenuePool = msg.sender;
        rate = 10;
        assetContract = ERCContractAddress;
    }
    
    function newUser(address _newUser) public onlyOwner returns (bool)  {
        bool newEntry = true;
        for (uint i = 0; i<users.length; i++) {
            if (users[i] == _newUser) {
                newEntry = false;
                revert('User already registered');
            }
        }
        if (newEntry) {
            (bool success, bytes memory data) = assetContract.call(abi.encodeWithSignature("signup(address,uint256)", _newUser, 1000));
            require(success);
            users.push(_newUser);
            userCounter++;
            authorBalance[_newUser] = 0;
            emit NewUser(userCounter, _newUser);
        }
        return newEntry;
    }
    
    
    function UpdateBal(address User, uint256 amount) public onlyOwner returns (bool)  {
        bool newEntry = false;
        for (uint i = 0; i<users.length; i++) {
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
            emit UpdateBalance(amount, User);
        }
        return newEntry;
    }

  function DeductBal(address User, uint256 amount, address Author) public onlyOwner returns (bool)  {
        bool newEntry = false;
        for (uint i = 0; i<users.length; i++) {
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
            revenue+=amount;
            authorBalance[Author]+= amount;
            emit DeductBalance(amount, User);
        }
        return newEntry;
    }
    
    function Redirect(address Author, uint256 amount) public onlyOwner returns(bool) {
        bool completeSuccess = false;
        uint256 ALTFee; uint256 AuthorEarnings;
        ALTFee = ((amount/100)*rate);
        AuthorEarnings = (amount-ALTFee);
        revenue-=AuthorEarnings;
        authorBalance[Author]-=amount;
        (bool successOne, bytes memory dataOne) = assetContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), Author, AuthorEarnings));
            require(successOne);
        (bool successTwo, bytes memory dataTwo) = assetContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), RevenuePool, ALTFee));
            require(successTwo);
        if (successOne && successTwo){
            completeSuccess = true;
            emit WithdrawEarnings(amount, Author);
        }
        return completeSuccess;
    }
    
    function setRevenue(address RevenueWallet) public onlyOwner returns (bool)  {
        RevenuePool = RevenueWallet;
        return true;
    }
    
    function setRate(uint8 newRate) public onlyOwner returns (bool)  {
        rate = newRate;
        return true;
    }
    function setAssetContract(address TokenContract) public onlyOwner returns (bool)  {
        assetContract = TokenContract;
        return true;
    }
        
    function getAuthorBalance(address User) public view returns (uint256)  {
        return authorBalance[User];
    }
    
    function getUserList() public view returns (UserDatabase[] memory)  {
        UserDatabase[] memory a = new UserDatabase[](users.length);
        for(uint256 i=0;i<users.length;i++){
            
            a[i]._address = users[i]; 
            a[i].balance = authorBalance[users[i]];
        }

    }
}
