import INDStorage from '../abis/INDStorage.json'
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink, Link } from "react-router-dom";
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';
//import Drop from './Drop';
import Gridview from './Gridview';
import Tableview from './Tableview';
import Sidebar1 from './Sidebar1';

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

const App = () => {
  const[account, setAccount] = useState('')
  const[indstorage, setIndstorage] = useState(null)
  const[files, setFiles] = useState([])
  const[filesCount, setFilesCount] = useState([])
  const[loading, setLoading] = useState(false)
  const[buffer, setBuffer] = useState(null)
  const[type, setType] = useState(null)
  const[name, setName] = useState(null)
  const[filesview, setFilesview] = useState(false)

  useEffect(() => {
    loadWeb3()
    loadBlockchainData()
  },[])

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  const loadBlockchainData = async () => {
    const web3 = window.web3
    console.log(web3);
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0])   
    console.log(accounts);
    const networkId = await web3.eth.net.getId()
    const networkData = INDStorage.networks[networkId]
    if(networkData) {
    // Assign contract
    const indstorage = new web3.eth.Contract(INDStorage.abi, networkData.address)
    setIndstorage(indstorage)
    console.log(indstorage);
    const filesCount = await indstorage.methods.fileCount().call()
    setFilesCount(filesCount);
    for (var i = filesCount; i >= 1; i--) {
      const file = await indstorage.methods.files(i).call()
      console.log('f',files);
      setFiles(files=>[...files, file])
    }
    } else {
      window.alert('INDStorage contract not deployed unable to detected network.')
      } 
    }

  const captureFile = event => {
    event.preventDefault()

    const file = event.target.files[0]
    const reader = new window.FileReader()

    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
        setBuffer(Buffer(reader.result))
        setType(file.type)
        setName(file.name)
    }
  }

  const captureDropFile = event => {
    event.preventDefault()
    console.log('dropped',event.dataTransfer.files[0]);
    const file = event.dataTransfer.files[0]
    const reader = new window.FileReader()

    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
        setBuffer(Buffer(reader.result))
        setType(file.type)
        setName(file.name)
    }
  }

  const cancleFile = event => {
    event.preventDefault()
    setBuffer(null)
    setType(null)
    setName(null)
  }

  const uploadFile = description => {
    console.log("Submitting file to IPFS...")
    ipfs.add(buffer,{wrapWithDirectory:true}, (error, result) => {
      console.log('IPFS result', result)
      if(error) {
        console.error(error)
        return
      }
      setLoading(true)
      if(type === ''){
        setType('none')
      }
      indstorage.methods.uploadFile(result[0].hash, result[0].size, type, name, description)
      .send({ from: account }).on('transactionHash', (hash) => {
         setLoading(false)
         setType(null)
         setName(null)       
      window.location.reload()
      }).on('error', (e) =>{
        window.alert('Error')
        setLoading(false)
      })
    })
  }

    return (
      <div>
        <Navbar account={account} />
        <Sidebar1 />
        {
          <div>
            <Switch>
              <Route exact path="/">
              </Route>
              <Route path="/share">{loading
                ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
                : <Main
                files={files}
                captureFile={captureFile}
                captureDropFile={captureDropFile}
                uploadFile={uploadFile}
                name={name}
                cancleFile={cancleFile}
                />}
              </Route>
              <Route path="/filestable">{loading
                ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
                : <Tableview
                files={files}
                />}
              </Route>
              <Route path="/filesgrid">{loading
                ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
                : <Gridview
                files={files}
                />}
              </Route>
            </Switch>
          </div>
        }
     
        
        
        <br/>
        <br/>
        <br/>
        {/* <Drop/> */}
      </div>
    );
}

export default App;