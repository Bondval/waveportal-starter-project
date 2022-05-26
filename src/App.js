import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");

  const [totalCount, setTotalCount] = useState(0);

  const contractAddress = "0xc468696e21fAa7776268C028b76F873168527e07";

  const contractABI = abi.abi;

  let waveMessage = '';

  let timeLocaleOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000).toLocaleDateString("en-US", timeLocaleOptions),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);

        let count = await wavePortalContract.getTotalWaves();
        setTotalCount(count.toNumber())

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      
      console.log(error);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000).toLocaleDateString("en-US", timeLocaleOptions),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);

      (async () => {
        let count = await wavePortalContract.getTotalWaves();
        setTotalCount(count.toNumber())
      })()
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      getAllWaves();

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;
      console.log('start');

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setTotalCount(count.toNumber())
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setTotalCount(count.toNumber())
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on('accountsChanged', async (accounts) => {
        if (!accounts.length) {
          setAllWaves([]);
          setCurrentAccount('');
        }
      });
    }
  }, [])

  const handleWaveMessageChange = (event) => {
    waveMessage = event.target.value;
  }

  return (
    <div className="main-container">
      <div className="blurred-box user-blurred-box">
        <div className="user-login-box">
          <span className="user-icon"></span>
          <div className="user-name"> 👋 Hey there!</div>
          <div className="user-name"> Connect your Ethereum wallet and wave to me! </div>

          {currentAccount && (
            <>
              <div className="user-name">Total Waves count: {totalCount}</div>
              <input className="waveMsg" type="text" onChange={handleWaveMessageChange} placeholder="Write a message"></input>
              <button className="waveButton" disabled={waveMessage} onClick={wave}>
                Wave to Me
              </button>
            </>
          )}

          {!currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="message-box">
        {allWaves.map((wave, index) => {
          return (
            <div className="message blurred-box" key={index}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App