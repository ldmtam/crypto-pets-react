import React from 'react';
import { Switch, Route } from 'react-router-dom';
import IndexGrid from './IndexGrid';
import GetPet from './GetPet';
import Trade from './Trade';
import MyPets from './MyPets';

const Main = () => (
    <main>
      <Switch>
        <Route exact path='/' component={IndexGrid}/>
        <Route path='/get-pet' component={GetPet}/>
        <Route path='/trade' component={Trade}/>
        <Route path='/my-pets' component={MyPets}/>
      </Switch>
    </main>
  )
  
  export default Main;