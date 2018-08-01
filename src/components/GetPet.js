import React, { Component } from 'react';
import { Form } from 'semantic-ui-react';
import { PacmanLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import { SyncLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import '../css/style.css';

var crypto = require("crypto");
var abi = require('../build/contracts/Main.json').abi;
var constants = require('../constants');

const metamaskLocked = {
    textAlign: 'center',
    fontFamily: 'Comic Sans MS'
}

const metamaskInstall = {
    textAlign: 'center',
    fontFamily: 'Comic Sans MS'
}

class GetPet extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isMetamaskInstalled: true,
            isMetamaskUnlocked: true,
            account: '',
            petName: '',
            loading: false,
            network: 0,
            componentLoading: true
        }
    }

    checkMetamaskUnlocked() {
        var web3 = window.web3;

        web3.eth.getCoinbase((er, re) => {
            if (re == null) {
                this.setState({
                    isMetamaskUnlocked: false,
                    componentLoading: false
                })
            } else {
                this.setState({
                    account: re,
                    isMetamaskUnlocked: true,
                    componentLoading: false
                })
            }
        })
       
    }

    getNetwork() {
        let networks = {
            '3': 'Ropsten',
            '4': 'Rinkeby',
            '1': 'Main network',
            '42': 'Kovan'
        }

        window.web3.version.getNetwork((er, re) => {
            if (er) console.log(er);
            this.setState({
                network: networks[re]
            })
        });
    }

    checkMetamaskInstalled() {
        if (typeof web3 !== 'undefined') {
            this.setState({
                isMetamaskInstalled: true
            }, () => {
                this.checkMetamaskUnlocked();
                this.getNetwork();
            })
        } else {
            this.setState({
                isMetamaskInstalled: false,
                componentLoading: false
            })
        }
    }

    componentDidMount() {
        this.interval = setInterval(this.checkMetamaskInstalled.bind(this), 100);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    handleChange = (e, { name, value }) => this.setState({ [name]: value })

    handleSubmit = (e) => {
        e.preventDefault();

        this.setState({
            loading: true
        })

        var web3 = window.web3;
        const { petName, account } = this.state;

        // Call to blockchain here :)
        var mainContract = web3.eth.contract(abi);
        var mainContractInstance = mainContract.at(constants.MainAddress);

        var dna = crypto.randomBytes(5).toString('hex');

        mainContractInstance.payForToken(petName, dna, {
            from: account,
            value: web3.toWei(0.05, 'ether'),
            gas: 300000,
            gasPrice: web3.toWei(30, 'shannon')
        }, (er, re) => {
            if (er) {
                this.setState({ loading: false });
                this.notifyTransactionRejected();
            }

            var tx = re;
            const filter = web3.eth.filter('latest');

            filter.watch((er, re) => {
                if (er) console.log(er);
                web3.eth.getBlock(re, true, (er, re) => {
                    if (er) console.log(er);

                    let transactions = re.transactions;
                    for (let i = 0; i < transactions.length; i++) {
                        if (tx === transactions[i].hash) {
                            this.setState({
                                loading: false,
                                petName: ''
                            })

                            this.notify();
                        }
                    }
                })  
            })
            
        });

        
    }   

    playEnterSound = () => this.audioEnter.play()
    playExitSound = () => this.audioExit.play();

    notify = () => toast.success("🦄🦄🦄 Congratulations! You got your pet. Please check in My Pets tab 🚀🚀🚀", {
        onOpen: this.playEnterSound,
        onClose: this.playExitSound,
        className: 'toastStyle',
        bodyClassName: 'toastBodyStyle'
    });

    notifyTransactionRejected = () => toast.error("You rejected the transaction. Please submit the transaction to get your pet", {
        onOpen: this.playEnterSound,
        onClose: this.playExitSound,
        className: 'toastStyle',
        bodyClassName: 'toastBodyStyle'
    });

    render() {
        const { isMetamaskInstalled, isMetamaskUnlocked, account, componentLoading } = this.state;

        if (componentLoading === true) {
            return (
                <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%, -50%)'}}>
                    <SyncLoader
                        color={'#36D7B7'} 
                        loading={this.state.componentLoading}
                    />
                </div>
            )
        }
        
        if (isMetamaskInstalled && isMetamaskUnlocked) {
            if (this.state.loading === true) {
                return (
                    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%, -50%)'}}>
                        <div style={{marginLeft:'45px'}}>
                            <PacmanLoader
                                color={'#36D7B7'} 
                                loading={this.state.loading}
                            />
                        </div>
                        <br /> <br />
                        <p style={{fontFamily:'Comic Sans MS'}}>Please wait for a few minutes ...</p>
                    </div>
                )
            } else {
                return (
                    <div style={{'margin':'20px','fontSize':'20px',fontFamily:'Comic Sans MS'}}>
                        <p>Your pet will belong to address: <b>{account}</b> on <b>{this.state.network}</b> </p>  
                        <p>This will cost you <b>0.05 ether</b> in exchange for a pet and a small amount of ether for transaction fee. Please make sure you have enough ether in your account.</p>
                        <Form onSubmit={this.handleSubmit}>
                            <Form.Field>
                                <Form.Input placeholder="Enter your pet name" name='petName' value={this.state.petName} onChange={this.handleChange} />
                            </Form.Field>
                            <Form.Button basic color='green' content="Get My Pet" />
                        </Form>
                        <div>
                            <ToastContainer
                                position="bottom-right"
                                autoClose={5000}
                                closeOnClick
                                draggable
                                pauseOnHover
                            />

                            <audio ref={r => this.audioEnter = r}>
                                <source
                                    src="https://notificationsounds.com/soundfiles/a86c450b76fb8c371afead6410d55534/file-sounds-1108-slow-spring-board.mp3"
                                    type="audio/mpeg"
                                />
                                </audio>
                                <audio ref={r => this.audioExit = r}>
                                <source
                                    src="https://notificationsounds.com/soundfiles/f387624df552cea2f369918c5e1e12bc/file-sounds-1092-hide-and-seek.mp3"
                                    type="audio/mpeg"
                                />
                            </audio>
                        </div>
                    </div>
                )
            }
        } 
        
        else if (isMetamaskInstalled && !isMetamaskUnlocked) {
            return (
                <div style={metamaskLocked}>
                    <h1>Your MetaMask is locked</h1>
                    <p>Simply open MetaMask and follow the instructions to unlock it.</p>
                    <img src='./images/locked-out.svg' alt="Crypto Pets"/>
                </div>
            )
        } 
          
        else if (!isMetamaskInstalled) {
            return (
                <div style={metamaskInstall}>
                    <h1 style={{fontSize: '60px'}}>Wanna join?</h1>
                    <p style={{fontSize: '15px'}}>You’ll need a safe place to store all of your adorable pets! The perfect place is in a secure wallet like MetaMask. This will also act as your login to the game (no extra password needed).</p>
                    <a style={{'border':'2px solid #4CAF50','color':'black','padding':'8px'}} rel="noopener noreferrer" target="_blank" href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en">Install MetaMask</a> <br/><br/>
                    <p style={{fontSize: '30px', color: 'red'}}>After installed MetaMask, please refresh the page.</p>
                    <iframe width="652" height="311" src="https://www.youtube.com/embed/tfETpi-9ORs" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>    
                </div>
            )
        }
    }
}

export default GetPet;