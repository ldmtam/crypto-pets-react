import React from 'react';
import { Card, Image } from 'semantic-ui-react';
import TimeAgo from 'react-timeago';

class SellingPetCard extends React.Component {
    getPetType(petDna) {
        let petType;
        if (parseInt(petDna.substring(0, 2), 16) % 2 === 0) {
            petType = 'Cat';
        } else {
            petType = 'Dog';
        }
        return petType;
    }

    render() {
        return (
            <Card>
                <Image style={{'with': 25, 'height': 240}} src={this.props.image} />
                <Card.Content>
                    <Card.Header>
                        Pet ID: {this.props.petId}
                    </Card.Header>
                    <Card.Meta>
                        <span>{this.getPetType(this.props.petDna).toUpperCase()} - <TimeAgo date={this.props.petBirth} /></span>
                    </Card.Meta>
                    <Card.Description>
                        <b>Price:</b> {this.props.price} <img height="20px" src="./images/icons8-ethereum-30.png" alt="Crypto pets" />
                    </Card.Description>
                </Card.Content>
            </Card>
        )
    }
}

export default SellingPetCard;