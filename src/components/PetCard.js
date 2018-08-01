import React from 'react';
import { Card, Image } from 'semantic-ui-react';
import TimeAgo from 'react-timeago';

class PetCard extends React.Component {
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
                        {this.props.petName}
                    </Card.Description>
                </Card.Content>
            </Card>
        )
    }
}

export default PetCard;