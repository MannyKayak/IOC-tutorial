import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal"
import { BigNumber, providers, Contract, utils } from 'ethers'
import {TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS} from "../constants";

export default function Home() {
  const zero = BigNumber.from(0);
  // Essentially the beginning of the program is alwayse the same: we want to verify that the wallet is 
  // connected, so create a constant function and variable to verify it
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenMinted, setTokenMinted] = useState(zero);
  const [balanceOfCryptoDevToken, setBalanceOfCryptoDevToken] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [loading, setLoading] = useState(false); // this variable is only used to improve user experience
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  // So far, i arrange the html, create all the div and buttons to mint, creating also the variables needed
  // to keep track of the changes and user input. Now is the moment to create the function to actually
  // mint the tokens.
  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);

      window.alert("You successfully claimed Crypto Devs Tokens!");

      await getBalanceOfCryptoDevToken();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();

    } catch (err) {
      console.error(err);
    }
  }

  const getTokensToBeClaimed = async () => {
    try{
      // this functuon need informations in the nft contract, because i need to know how many NFT the signer has
      // so i'll create an instance to the nft contract.
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider,
      );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider,
      );
    
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        let amount = 0;
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdClaimed(tokenId);
          if (!claimed) {
            amount += i;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeClaimed(zero);
    }
  };

  const getTotalTokenMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )
      
      const _tokenMinted = await tokenContract.totalSupply();
      setTokenMinted(_tokenMinted);
    } catch (e) {
      console.error(e);
    }
  };

  const getBalanceOfCryptoDevToken = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const signer = await getProviderOrSigner(true);
      const address = signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevToken(balance);

    } catch (error) {
      console.error(error);
    }
  };

  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )

      const value  = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString())
      });

      setLoading(true);
      await tx.wait();
      setLoading(false);

      window.alert("You successfully minted Crypto Devs tokens!");
      await getBalanceOfCryptoDevToken();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.log(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) =>{
    // WHEN CALL PROVIDER OR SIGNER: the provider is essentially used when you need to 'view' something
    // inside the contract, so you don't need to change the state of the contract, the signer instead 
    // is used when you need to change the state of the contract.

    // this line return a provider, to get it i use the previous web3 reference i created
    const provider = await web3ModalRef.current.connect();
    // here we use the class providers to instanciate the correct provider
    const web3Provider = new providers.Web3Provider(provider);
    // now that we have the provider we can access all the information we need

    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change the network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;


  };

  const web3ModalRef = useRef();

  const connectWallet = async () => {
    try{
      // check that user is connected to the correct network
      await getProviderOrSigner();
      // check the user is in the corrected network
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const renderButton = () => {
    if (loading) {
      return (
        <button className={styles.button}>Loading...</button>
      );
    }

    if (tokensToBeClaimed > 0) {
      // keep track of tokens user can claim
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} CD Tokens can be claimed!
          </div>
          <button
            className={styles.button}
            onClick={claimCryptoDevTokens} >Claim Tokens</button>
        </div>
      );
    }
    // the user can mint CDT or claim if they have CD-NFT's
    return (
      <div style={{display: 'flex-col'}}>
        <div>
          <input 
            type='number' 
            placeholder="Amount of tokens" 
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value)) }
          />
          <button 
            disabled={!(tokenAmount > 0)} 
            className={styles.button} 
            onClick={() => mintCryptoDevToken(tokenAmount)}
          >
            Mint Tokens
          </button>

        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!walletConnected){
      // create a reference to the network connection and the provider
      web3ModalRef.current = new Web3Modal({
        network:'goerli',
        providerOptions: {},
        disableInjectedProvider: false
      });
      connectWallet();

      getBalanceOfCryptoDevToken();
      getTotalTokenMinted();
      getTokensToBeClaimed();
    }

  }, [walletConnected])

  return (
    <div>
      <Head>
        <title>Crypto Devs ICO</title>
        <meta name='description' content='ICO-dApp'/>
        <link rel='icon' href="./favicon.ico"/>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Wellcome to Crypto Devs ICO</h1>
          <div className={styles.description}>
            you can claim or mint Crypto Devs token here
          </div>
          {
            walletConnected ? (
              <div>
                <div className={styles.description}>
                  You have minted {utils.formatEther(balanceOfCryptoDevToken)} Drypto Devs Tokens
                </div>
                <div className={styles.description}>
                  Overall {utils.formatEther(tokenMinted)}/10000 have been minted
                </div>

                {renderButton()}

              </div>
            ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your Wallet
            </button>
            )
          }

        </div>
      </div>
      <div>
        <img className={styles.image} src="./0.svg" />
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>

    </div>
  )
}
