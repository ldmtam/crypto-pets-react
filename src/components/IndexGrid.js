import React, { Component } from 'react';
import { Grid, GridColumn, Pagination } from 'semantic-ui-react';
import axios from 'axios';
import { SyncLoader } from 'react-spinners';
import PetCard from './PetCard';

var constants = require('../constants');

var axiosInstance = axios.create({
    baseURL: constants.baseURL
});

class IndexGrid extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pageCount: 0,
            activePage: 1,
            offset: 0,
            componentLoading: true
        }

        this.handlePaginationChange = this.handlePaginationChange.bind(this);
    }

    async loadData() {
        let limit = 6;
        let offset = this.state.offset;
        try {
            const response = await axiosInstance.post('/get-tokens', {
                limit: limit.toString(),
                offset: offset.toString()
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
    

    componentDidMount() {
        this.loadData();
    }

    handlePaginationChange(e, { activePage }) {
        let newOffset = (activePage - 1) * 6;
        
        this.setState({ activePage: activePage, offset: newOffset, componentLoading: true }, () => {
            this.loadData()
        });
    }

    //this function will return array of elements
    multipleElements() {
        let elements = [];
        let totalElements = this.state.data.length;
        for(let i = 0; i < totalElements; i++) {
            let image = `${this.state.data[i].tokenId}.png`;
            let petId = this.state.data[i].tokenId;
            let petName = this.state.data[i].name;
            let petDna = this.state.data[i].dna;
            let petBirth = new Date(this.state.data[i].petBirth * 1000);

            elements.push(
                <Grid.Column>
                    <PetCard  
                        image={`${constants.baseURL}/images/${image}`}
                        petId={petId}
                        petDna={petDna}
                        petName={petName}
                        petBirth={petBirth}
                    />
                </Grid.Column> 
            )
        }
        return elements;
    }

    separateElement () { 
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

    render() { 
        if (this.state.componentLoading === true) {
            return (
                <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%, -50%)'}}>
                    <SyncLoader
                        color={'#36D7B7'} 
                        loading={this.state.componentLoading}
                    />
                </div>
            )
        }

        else {
            return (
                <Grid columns={6}>
                    {this.separateElement()}
    
                    <Grid.Row>
                        <Grid.Column>
                            <div></div>
                        </Grid.Column>
                        <Grid.Column>
                            <div></div>
                        </Grid.Column>
                        <Pagination 
                            totalPages={this.state.pageCount} 
                            firstItem={null}
                            lastItem={null}
                            onPageChange={this.handlePaginationChange}
                            activePage={this.state.activePage}
                        />
                    </Grid.Row>
                </Grid>
            )
        } 
    }
}


export default IndexGrid;