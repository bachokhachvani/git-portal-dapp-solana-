import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js"
import { Program, Provider, web3 } from "@project-serum/anchor"
import { Buffer } from "buffer";
import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from "./idl.json"
import kp from "./keypair.json";

const { SystemProgram, Keypair } = web3;
window.Buffer = Buffer;
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programId = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = { PreflightCommitment: "processed" }


// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS =
  [
    "//giphy.com/embed/STYcRDzNO6AYNmMgvA",
    "//giphy.com/embed/dtI80RwAsPYCmGiUn6",
    "https://giphy.com/embed/W35tkcJTrzc1ZuPbYp"
  ]


const App = () => {
  const [walletAddress, setWalletAdress] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [gifList, setGifList] = useState([])
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("phantom wallet found!")

          const response = await solana.connect({ onlyIfTrusted: true })
          console.log("Connected with Public key: " + response.publicKey.toString())
          setWalletAdress(response.publicKey.toString())
        }
      } else {
        // alert("get the phantom wallet!")
      }
    }

    catch (err) {
      console.error(err);
    }
  }

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("your wallet public key:", response.publicKey.toString())
      setWalletAdress(response.publicKey.toString())
    }
  }

  const renderNotConnected = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>connect Wallet</button>
  )
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value)
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.PreflightCommitment)
    const provider = new Provider(connection, window.solana, opts.PreflightCommitment)
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      })
      console.log("created new base account with address", baseAccount.publicKey.toString());
      await getGifList();
    } catch (err) {
      console.log("error creating baseAccount account", err)
    }
  }

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log("GIF link", inputValue)

      try {
        const provider = getProvider()
        const program = new Program(idl, programId, provider);
        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          }
        })
        console.log("GIF succesfully sent to program", inputValue);
        await getGifList()
        setInputValue("")
      } catch (err) {
        console.log(err);
      }
    } else { console.log("Empty input Try again") }
  }
  const renderConnected = () => {
    if (gifList === null) {
      return <div className="connected-container"><button className="cta-button submit-gif-button" onClick={createGifAccount}>do one time initialization for GIF program account</button></div>
    }
    else {
      return (
        <div className="connected-container">
          <form onSubmit={event => {
            event.preventDefault()
            sendGif()
          }}>
            <input type="text" placeholder="enter gif link:" value={inputValue} onChange={onInputChange} />
            <button type="submit" className="cta-button submit-gif-button">submit</button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              < div className="gif-item" key={index} > <iframe src={item.gifLink} alt={item.gifLink} /></div>
            ))}
          </div>
        </div>
      )
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    }
    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])
  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      console.log("got the account", account);
      setGifList(account.gifList)

    } catch (err) {
      console.log(err)
      setGifList(null);
    }
  }


  useEffect(() => {
    if (walletAddress) {
      console.log("fetching a gif list...")
      getGifList()
    }
  }, [walletAddress])
  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnected()}
          {walletAddress && renderConnected()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Adapted from @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
