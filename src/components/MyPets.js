/** Common libraries */
import React, { Component } from 'react';
import { Grid, GridColumn, Pagination, Button, Modal, Icon, Image, Input, Label } from 'semantic-ui-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { SyncLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import '../css/style.css';

/** PetCard component  */
import PetCard from './PetCard';

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

class MyPets extends Component {
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
            modal1Open: false,
            modal2Open: false,
            modalChangeName: false,
            loading: false,
            /**--------------- */
            amount: '',
            error: '',
            /**--------------- */
            modalData: {},
            /**--------------- */
            newName: '',
            componentLoading: true
        }

        this.handlePaginationChange = this.handlePaginationChange.bind(this);
        this.handleClose1 = this.handleClose1.bind(this);
        this.handleClose2 = this.handleClose2.bind(this);
        //this.handleCloseChangeName = this.handleCloseChangeName.bind(this);
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
            const response = await axiosInstance.post('/get-tokens-by-user', {
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

    handleOpen1(data) {
        this.setState({ modal1Open: true, modalData: data });
    }

    handleClose1() {
        this.setState({ modal1Open: false })
    }

    handleOpen2(data) {
        this.setState({ modal2Open: true, modalData: data });
    }

    handleClose2() {
        this.setState({ modal2Open: false, amount: '', error: '' })
    }

    onInputChange(e) {
        e.preventDefault();

        if (e.target.name === 'amount') {
            this.setState({ amount: e.target.value }, () => {
                if (this.state.amount < 0.05 && this.state.amount !== '') {
                    this.setState({ error: 'Must be equal or greater than 0.05 ether.'});
                } else {
                    this.setState({ error: '' });
                }
            });
        } else if (e.target.name === 'newName') {
            this.setState({ newName: e.target.value }, () => {
                if (this.state.newName === '') {
                    this.setState({ error: 'Please enter a name !!!'});
                } else {
                    this.setState({ error: '' });
                }
            });
        }
        
    }

    onSellClick(e) {
        var petId = this.state.modalData.petId;
        var amount = this.state.amount;

        this.setState({ loading: true });

        var web3 = window.web3;

        // TODO: call to nodejs API.
        var mainContract = web3.eth.contract(abi);
        var mainContractInstance = mainContract.at(constants.MainAddress);

        mainContractInstance.sellToken(petId, web3.toWei(amount, 'ether'), {
            from: this.state.account,
            gas: 300000,
            gasPrice: web3.toWei(30, 'shannon')
        }, (er, re) => {
            if (er) {
                this.setState({ loading: false });
                this.notify();
            }
            
            this.handleClose2();

            var tx = re;
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
                })  
            })
        })

    }

    onSellCancelClick(e) {
        var petId = this.state.modalData.petId;
        
        this.setState({ loading: true });

        var web3 = window.web3;

        var mainContract = web3.eth.contract(abi);
        var mainContractInstance = mainContract.at(constants.MainAddress);

        mainContractInstance.cancelOrder(petId, {
            from: this.state.account,
            gas: 300000,
            gasPrice: web3.toWei(30, 'shannon')
        }, (er, re) => {
            if (er) {
                this.setState({ loading: false });
                this.handleClose1();
                
                this.notify();
            }

            this.handleClose1(); 

            var tx = re;
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
                })  
            })
        })
    }

    renderConditionButton(data) {
        if (this.state.loading === true) {
            return (
                <Button color='pink' disabled inverted>
                    <Icon name='refresh' /> Progressing ...
                </Button>
            )
        }

        else if (data.isSelling) {
            return (
                <Modal
                    trigger={
                        <Button inverted color='red' 
                            onClick={this.handleOpen1.bind(this, data)}>
                            <Icon name='cancel' />Cancel Selling
                        </Button>
                    }
                    open={this.state.modal1Open}
                    onClose={this.handleClose1}
                >
                    <Modal.Header style={{fontFamily:'Comic Sans MS'}}>Cancel Selling Pet</Modal.Header>
                    <Modal.Content>
                        <div style={{fontFamily:'Comic Sans MS',fontSize:'15px'}}>Are you sure to cancel selling pet with ID <b>{this.state.petId}</b> ?</div>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color='red' id={this.state.petId} onClick={this.onSellCancelClick.bind(this)} inverted>
                            <Icon name='checkmark' /> Yes
                        </Button>
    
                        <Button color='green' onClick={this.handleClose1} inverted>
                            <Icon name='close' /> No
                        </Button>
                    </Modal.Actions>
                </Modal>
            )
        }  
                
        else if (!data.isSelling) {
            return (
                <Modal
                    trigger={
                        <Button inverted color='green' 
                        onClick={this.handleOpen2.bind(this, data)}>
                            <Icon name='money' />Sell
                        </Button>
                    }
                    open={this.state.modal2Open}
                    onClose={this.handleClose2}
                >
                    <Modal.Header style={{fontFamily:'Comic Sans MS'}}>Sell a pet</Modal.Header>
                    <Modal.Content>
                        <div style={{fontFamily:'Comic Sans MS',fontSize:'15px'}}>How much do you want to sell your pet with ID <b>{this.state.modalData.petId}</b> ?</div>
                        <Grid columns={2} style={{marginTop:'5px'}}>
                            <Grid.Row>
                                <Grid.Column>
                                    <Image style={{'height': 240,'margin':'auto'}} src={this.state.modalData.image} alt="Crypto Pets"/>
                                </Grid.Column>
                                <Grid.Column>
                                    <Input name='amount' value={this.state.amount} onChange={this.onInputChange.bind(this)}  labelPosition='right' type='text' placeholder='Amount'>
                                        <Label basic><Image src="./images/icons8-ethereum-30.png" /></Label>
                                        <input type='number' />
                                        <Label style={{lineHeight:'32px'}}>ether</Label>
                                    </Input> <br/>
                                    <p style={{fontSize:'30px',color:'red',fontFamily:'Comic Sans MS'}}>{this.state.error}</p>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color='red' disabled={this.state.amount===''||this.state.error!==''?true:false} onClick={this.onSellClick.bind(this)} id={this.state.modalData.petId} inverted>
                            <Icon name='checkmark' /> Yes
                        </Button>
    
                        <Button color='green' onClick={this.handleClose2} inverted>
                            <Icon name='close' /> No
                        </Button>
                    </Modal.Actions>
                </Modal>
            )
        }
    }

    handleChangeNameOpen(data) {
        this.setState({ modalChangeName: true, modalData: data });
    }

    handleChangeNameClose() {
        this.setState({ modalChangeName: false, newName: '', error: '' });
    }

    changePetName() {
        let petId = this.state.modalData.petId;
        let newName = this.state.newName;

        this.setState({ loading: true });
        
        var web3 = window.web3;

        var mainContract = web3.eth.contract(abi);
        var mainContractInstance = mainContract.at(constants.MainAddress);

        mainContractInstance.changePetName(petId, newName, {
            from: this.state.account,
            gas: 300000,
            gasPrice: web3.toWei(30, 'shannon')
        }, (er, re) => {
            if (er) {
                this.setState({ loading: false });
                this.notify();
            }
            
            this.handleChangeNameClose();

            var tx = re;
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
                })  
            })
        });
    }

    renderChangeNameButton(data) {
        if (this.state.loading === true) {
            return (
                <Button color='pink' disabled inverted>
                    <Icon name='refresh' /> Progressing ...
                </Button>
            )
        }

        else if (data.isSelling) {

        }

        else if (!data.isSelling) {
            return (
                <Modal
                    trigger={<Button inverted color='purple' onClick={this.handleChangeNameOpen.bind(this, data)}>Change name</Button>}
                    open={this.state.modalChangeName}
                    onClose={this.handleChangeNameClose.bind(this)}
                >
                    <Modal.Header style={{fontFamily:'Comic Sans MS'}}>Change Pet Name</Modal.Header>
                    <Modal.Content>
                        <div style={{fontFamily:'Comic Sans MS',fontSize:'15px'}}>Which name do you want to take for pet with ID <b>{this.state.modalData.petId}</b> ?</div>
                        <Grid columns={2} style={{marginTop:'5px'}}>
                            <Grid.Row>
                                <Grid.Column>
                                    <Image style={{'height': 240,'margin':'auto'}} src={this.state.modalData.image} alt="Crypto Pets"/>
                                </Grid.Column>
                                <Grid.Column>
                                    <Input name='newName' value={this.state.newName} onChange={this.onInputChange.bind(this)}  labelPosition='right' type='text' placeholder='Amount'>
                                        <Label style={{lineHeight:'32px'}}>New name: </Label>
                                        <input />
                                    </Input> <br/>
                                    <p style={{fontSize:'30px',color:'red',fontFamily:'Comic Sans MS'}}>{this.state.error}</p>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color='red' disabled={this.state.newName===''||this.state.error!==''?true:false} onClick={this.changePetName.bind(this)} id={this.state.modalData.petId} inverted>
                            <Icon name='checkmark' /> Yes
                        </Button>
    
                        <Button color='green' onClick={this.handleChangeNameClose.bind(this)} inverted>
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
                petBirth: new Date(this.state.data[i].petBirth * 1000),
                isSelling: this.state.data[i].isSelling
            }

            elements.push(
                <Grid.Column>
                    <PetCard  
                        image={petData.image}
                        petId={petData.petId}
                        petDna={petData.petDna}
                        petName={petData.petName}
                        petBirth={petData.petBirth}
                    />
                    <div style={{textAlign:'center'}}>
                        { this.renderConditionButton(petData) }
                        { this.renderChangeNameButton(petData) } 
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
                        You don't own any pet !!! <img width='40px' height='40px' src="./images/loudly-crying-face_1f62d.png" alt="Crypto Pets" />
                    </div>

                    <div style={{fontSize:'30px',textAlign:'center',marginTop:'20px',fontFamily:'Comic Sans MS'}}>
                        <p>You can click <Link to='/get-pet'>here</Link> to get your first pet <img width='40px' height='40px' src='./images/smiling-face-with-smiling-eyes_1f60a.png' alt="Crypto Pets" /></p>
                        <p>or click <Link to='/trade'>here</Link> to buy the pet you like </p>
                    </div>
                </div>
            )
        }

        if (isMetamaskInstalled && isMetamaskUnlocked && pageCount > 0) {
            return (
                <div>
                    <div style={{fontSize:'20px',textAlign:'center',fontFamily:'Comic Sans MS'}}>
                        <p>Pet(s) belongs to <b>{this.state.account}</b> !!!</p>
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

export default MyPets;