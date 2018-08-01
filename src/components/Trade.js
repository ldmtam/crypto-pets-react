/** Common libraries */
import React, { Component } from 'react';
import { Grid, GridColumn, Pagination, Button, Modal, Icon, Image, Input, Label } from 'semantic-ui-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { SyncLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/style.css';

/** PetCard component  */
import SellingPetCard from './SellingPetCard';

/** required to call to smart contract */
var constants = require('../constants');
var abi = require('../build/contracts/Main.json').abi;

var axiosInstance = axios.create({
    baseURL: constants.baseURL
});

const metamaskLocked = {
    textAlign: 'center',
    fontFamily: 'Comic Sans MS'
}   

const metamaskInstall = {
    textAlign: 'center',
    fontFamily: 'Comic Sans MS'
}

class Trade extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /**--------------- */
            data: [],
            pageCount: 0,
            activePage: 1,
            offset: 0,
            /**- Check whether Metamask is installed or unlocked or not - */
            isMetamaskInstalled: true,
            isMetamaskUnlocked: true,
            account: '',
            /**
             * modal1Open: controls the opening of cancel selling pet modal
             * modal2Open: controls the opening of selling pet modal
             * loading: controls stage of sell button
             */
            modal: false,
            loading: false,
            /**--------------- */
            amount: '',
            error: '',
            /**--------------- */
            modalData: {},
            componentLoading: true
        }

        this.handlePaginationChange = this.handlePaginationChange.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    checkMetamaskInstalled() {
        if (typeof web3 !== 'undefined') {
            this.setState({
                isMetamaskInstalled: true
            }, () => {
                this.checkMetamaskUnlocked();
            });
        } else {
            this.setState({
                isMetamaskInstalled: false,
                componentLoading: false
            })
        }
    }

    checkMetamaskUnlocked() {
        var web3 = window.web3;

        if (web3.eth.accounts.length === 0) {
            // set pageCount to fix error when pageCount is NaN
            this.setState({ isMetamaskUnlocked: false, pageCount: 0, componentLoading: false }) 
        } else {
            this.setState({ isMetamaskUnlocked: true })

            if (web3.eth.accounts[0] !== this.state.account) {
                this.setState({ account: web3.eth.accounts[0], componentLoading: true }, () => {
                    this.loadData();
                });
            }
        }        
    }

    componentDidMount() {
        this.interval = setInterval(this.checkMetamaskInstalled.bind(this), 100);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    async loadData() {
        let limit = 6;
        let offset = this.state.offset.toString();
        try {
            const response = await axiosInstance.post('/get-selling-tokens', {
                address: this.state.account,
                limit: limit,
                offset: offset
            });

            this.setState({ 
                data: response.data.data,
                pageCount: Math.ceil(response.data.count / limit),
                componentLoading: false
            });
        } catch (error) {
            console.error(error);
        }
    }

    handlePaginationChange(e, { activePage }) {
        let newOffset = (activePage - 1) * 6;
        
        this.setState({ activePage: activePage, offset: newOffset }, () => {
            this.loadData()
        });
    }

    handleOpen(data) {
        this.setState({ modal: true, modalData: data });
    }

    handleClose() {
        this.setState({ modal: false })
    }

    onBuyClicked(petId, price) {
        this.setState({ loading: true });

        var web3 = window.web3;

        var mainContract = web3.eth.contract(abi);
        var mainContractInstance = mainContract.at(constants.MainAddress);

        mainContractInstance.buyToken(petId, {
            from: this.state.account,
            value: web3.toWei(price, 'ether'),
            gas: 300000,
            gasPrice: web3.toWei(30, 'shannon')
        }, (er, re) => {
            if (er) {
                this.setState({ loading: false });
                this.notify();
            }
            this.handleClose();

            let tx = re;
            const filter = web3.eth.filter('latest');

            filter.watch((er, re) => {
                if (er) console.log(er);
                web3.eth.getBlock(re, true, (er, re) => {
                    if (er) console.log(er);

                    let transactions = re.transactions;
                    for (let i = 0; i < transactions.length; i++) {
                        if (tx === transactions[i].hash) {
                            this.setState({ loading: false });
                            this.loadData();
                        }
                    }
                });
            });
        });
    }

    getPetType(petDna) {
        if (typeof petDna !== 'undefined') {
            let petType;
            if (parseInt(petDna.toString().substring(0, 2), 16) % 2 === 0) {
                petType = 'Cat';
            } else {
                petType = 'Dog';
            }
            return petType;
        }
    }

    getDateTime(dateData) {
        if (typeof dateData !== 'undefined') {
            let d = new Date (dateData);
            let day = d.getDate();
            let month = d.getMonth() + 1;
            let year = d.getFullYear();
            let hour = d.getHours();
            let minute = d.getMinutes();
            let seconds = d.getSeconds();
            let result = `${hour}h : ${minute}m : ${seconds}s on ${month}/${day}/${year} `;
            return result;
        }
    }
    getDateTimeFromUnix(dateData) {
        if (typeof dateData !== 'undefined') {
            let d = new Date (dateData * 1000);
            let day = d.getDate();
            let month = d.getMonth() + 1;
            let year = d.getFullYear();
            let hour = d.getHours();
            let minute = d.getMinutes();
            let seconds = d.getSeconds();
            let result = `${hour}h : ${minute}m : ${seconds}s on ${month}/${day}/${year} `;
            return result;
        }
    }

    renderConditionButton(data) {
        if (this.state.loading === true) {
            return (
                <Button color='pink' disabled inverted>
                    <Icon name='refresh' /> Progressing ...
                </Button>
            )
        }

        else {
            return (
                <Modal
                    trigger={
                    <Button color='violet' inverted onClick={this.handleOpen.bind(this, data)}>
                        <Icon name='shopping cart' /> Buy
                    </Button>}
                    open={this.state.modal}
                    onClose={this.handleClose}
                    dimmer={'blurring'}
                >
                    <Modal.Header style={{fontFamily:'Comic Sans MS'}}>Buy a pet</Modal.Header>
                    <Modal.Content>
                        <div style={{fontFamily:'Comic Sans MS',fontSize:'15px'}}>Do you really want to buy this pet ??? </div>
                        <Grid columns={2} style={{marginTop:'5px'}}>
                            <Grid.Row>
                                <Grid.Column>
                                    <Image style={{'height': 240,'margin':'auto'}} src={this.state.modalData.image} alt="Crypto Pets"/>
                                </Grid.Column>
                                <Grid.Column>
                                    <div style={{fontFamily:'Comic Sans MS'}}>
                                        <p><b style={{color:'blue'}}>Pet ID:</b> {this.state.modalData.petId}</p>
                                        <p><b style={{color:'blue'}}>Pet Name:</b> {this.state.modalData.petName}</p>
                                        <p><b style={{color:'blue'}}>Pet Birth:</b> {this.getDateTime(this.state.modalData.petBirth)}</p>
                                        <p><b style={{color:'blue'}}>Pet Type:</b> {this.getPetType(this.state.modalData.petDna)}</p>
                                        <p><b style={{color:'blue'}}>Price:</b> {this.state.modalData.price} <img style={{'marginTop':'6px'}} height="15px" src="./images/icons8-ethereum-30.png" alt="Crypto pets" /></p>
                                        <p><b style={{color:'blue'}}>Owner:</b> {this.state.modalData.owner}</p>
                                        <p><b style={{color:'blue'}}>Sell at:</b> {this.getDateTimeFromUnix(this.state.modalData.sellingAt)} </p>
                                   </div>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color='red' onClick={this.onBuyClicked.bind(this, this.state.modalData.petId, this.state.modalData.price)} inverted>
                            <Icon name='checkmark' /> Yes
                        </Button>
    
                        <Button color='green' onClick={this.handleClose} inverted>
                            <Icon name='close' /> No
                        </Button>
                    </Modal.Actions>
                </Modal>
            )
        }
          
    }

    multipleElements() {
        let elements = [];
        let totalElements = this.state.data.length;
        for(let i = 0; i < totalElements; i++) {

            let petData = {
                image: `${constants.baseURL}/images/${this.state.data[i].tokenId}.png`,
                petId: this.state.data[i].tokenId,
                petName: this.state.data[i].name,
                petDna: this.state.data[i].dna,
                petBirth: this.state.data[i].createdAt,
                isSelling: this.state.data[i].isSelling,
                owner: this.state.data[i].address,
                sellingAt: this.state.data[i].sellingAt,
                price: window.web3.fromWei(this.state.data[i].price, 'ether')
            }

            elements.push(
                <Grid.Column>
                    <SellingPetCard  
                        image={petData.image}
                        petId={petData.petId}
                        petDna={petData.petDna}
                        petName={petData.petName}
                        petBirth={petData.petBirth}
                        price={petData.price}
                    />
                    <div style={{textAlign:'center'}}>
                        { this.renderConditionButton(petData) }
                    </div>
                    
                </Grid.Column> 
            )
        }
        return elements;
    }
    
    separateElement() {
        var multiElements = this.multipleElements();
        var rows = [];

        for(var i = 0; i < multiElements.length; i += 3) {
            rows.push(
                <Grid.Row key={i}>
                    <GridColumn><div></div></GridColumn>
                    {multiElements[i]}
                    {multiElements[i+1]}
                    {multiElements[i+2]}
                    <GridColumn><div></div></GridColumn>
                </Grid.Row>
            )
        }
        return rows;
    }

    playEnterSound = () => this.audioEnter.play()
    playExitSound = () => this.audioExit.play();

    notify = () => toast.error("You rejected the transaction. Please submit it 🚀🚀🚀", {
        onOpen: this.playEnterSound,
        onClose: this.playExitSound,
        className: 'toastStyle',
        bodyClassName: 'toastBodyStyle'
    });

    render() {
        const { isMetamaskInstalled, isMetamaskUnlocked, pageCount, componentLoading } = this.state;

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

        if (!isMetamaskInstalled) {
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

        if (!isMetamaskUnlocked) {
            return (
                <div style={metamaskLocked}>
                    <h1>Your MetaMask is locked</h1>
                    <p>Simply open MetaMask and follow the instructions to unlock it.</p>
                    <img src='./images/locked-out.svg' alt="Crypto Pets"/>
                </div>
            )
        }

        if (isMetamaskInstalled && isMetamaskUnlocked && pageCount === 0) {
            return (
                <div>
                    <div style={{fontSize:'30px',textAlign:'center',marginTop:'20px',fontFamily:'Comic Sans MS'}}>
                        Sorry but we don't have any pet on the market at this moment !!! <img width='40px' height='40px' src="./images/loudly-crying-face_1f62d.png" alt="Crypto Pets" />
                    </div>
                </div>
            )
        }

        if (isMetamaskInstalled && isMetamaskUnlocked && pageCount > 0) {
            return (
                <div>
                    <div style={{fontSize:'20px',textAlign:'center',fontFamily:'Comic Sans MS'}}>
                        <p>You're buying pets for account:  <b>{this.state.account}</b> !!!</p>
                    </div>

                    <br />

                    <Grid columns={6}>
                        {this.separateElement()}
        
                        <Grid.Row>
                            <Grid.Column><div></div></Grid.Column>
                            <Grid.Column><div></div></Grid.Column>
                        
                            <Pagination 
                                totalPages={this.state.pageCount} 
                                firstItem={null}
                                lastItem={null}
                                onPageChange={this.handlePaginationChange}
                                activePage={this.state.activePage}
                            />

                            <Grid.Column><div></div></Grid.Column>
                            <Grid.Column><div></div></Grid.Column>
                        </Grid.Row>
                    </Grid>
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
                                    ype="audio/mpeg"
                            />
                        </audio>
                    </div>
                </div>
            )
        }   
    }
}

export default Trade;