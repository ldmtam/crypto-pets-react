import React, { Component } from 'react';
import { Link } from 'react-router-dom'

const marginStyle = {
    marginBottom: '15px'
};

const itemStyle = {
    marginBottom: '5px'
};

class Header extends Component { 
    render() {
        return (
            <div style={marginStyle}>
                <div className="ui secondary pointing menu">
                    <Link className="active item" to="/">
                        <img src="./images/pet.png" alt="Crypto pets" />
                    </Link>
                    <Link style={itemStyle} className="item" to='/get-pet'>Get a pet</Link>
                    <Link style={itemStyle} className="item" to='/trade'>Let's trade</Link>
                    <div className="right menu">
                        <Link style={itemStyle} className="item" to='/my-pets'>My Pets</Link>
                    </div>
                </div>
            </div>
        )
    }
}

export default Header;