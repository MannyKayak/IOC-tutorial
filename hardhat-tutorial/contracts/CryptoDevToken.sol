// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable{
    // keep track of the NFTs interface
    ICryptoDevs CryptoDevsNFT;

    // global variables
    uint256 public constant tokensPerNFT = 10 * 10**18; // remember ibg numbers theory
    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant maxTotalSupply = 10000 * 10**18; 
    // keep track of which tokens have been claim
    mapping (uint256 => bool) public tokenIdClaimed;
    constructor(address _cryproDevsContract) ERC20("Crypto Dev Token", "CD") {
        // after initializing the interface, "fill it" with the address of the contract
        CryptoDevsNFT = ICryptoDevs(_cryproDevsContract);
    }

    function mint(uint256 amount) public payable {
        uint256 _requiredAmount = tokenPrice * amount;

        require(msg.value >= _requiredAmount, "Ether sent is incorrect");
        uint256 amountWithDecimals = amount * 10**18;
        require(totalSupply() + amountWithDecimals <= maxTotalSupply, "Exceeded maximummax total supply");
        _mint(msg.sender, amountWithDecimals);
    }

    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        require( balance > 0 , "You don't own any CryptoDev NFT's");
        uint256 amount = 0;
        for (uint i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender,i);
            if (!tokenIdClaimed[tokenId]) {
                amount += 1;
                tokenIdClaimed[tokenId] = true;
            }
        }
        require(amount > 0, "You have already claimed all tokens");

        _mint(msg.sender, amount * tokensPerNFT); // function to mint
    } 

    receive() external payable{}

    fallback() external payable{}
}