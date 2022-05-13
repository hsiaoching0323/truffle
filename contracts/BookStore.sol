// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./StoreFront.sol";
contract BookStore is ERC1155 {
    uint256 private _currentBookVersionId;
    StoreFront private _storeFront;
    mapping (uint256 => BookVersion) private _bookVersions;

    struct BookVersion{
        uint price;
        address currency;
        address author;
    }
    
    address private _owner;

    constructor() ERC1155("https://example.com/api/{id}.json"){
         _currentBookVersionId = 1;
         _owner = msg.sender;
    }

    function setStoreFront(address _storeFrontAddress) public {
        require(msg.sender == _owner,"BookStore: only contract owner can set storeFront");
         _storeFront = StoreFront(_storeFrontAddress);
    }

    function publish(uint256 _quantity, uint256 _price, address _currency) public {
        _mint(msg.sender, _currentBookVersionId, _quantity, "");
        _bookVersions[_currentBookVersionId] = BookVersion(_price, _currency,msg.sender);
        // _bookVersionPrices[_currentBookVersionId]  = _price;
        // _bookVersionCurrencies[_currentBookVersionId] = _currency;
        _currentBookVersionId += 1;
    }
    
    function transferFromAuthor(address _buyer,uint256 _bookVersionId) public{
        require(msg.sender == address(_storeFront),"Method can only be called by store_front contract");
        BookVersion memory bookVersion = _bookVersions[_bookVersionId];
        safeTransferFrom(bookVersion.author, _buyer,_bookVersionId, 1, "");

    }

    function book_version_price(uint256 _bookVersionId) public view returns(uint256){
        return _bookVersions[_bookVersionId].price;
    }
    function book_version_currency(uint256 _bookVersionId) public view returns(address){
        return _bookVersions[_bookVersionId].currency;
    }

    function book_version_Author(uint256 _bookVersionId) public view returns(address){
        return _bookVersions[_bookVersionId].author;
    }
}