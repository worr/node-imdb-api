import React, { Component } from 'react';
import './App.css';
import * as imdb from 'imdb-api';

type MyProps = {}

type MyState = {
    movie: imdb.Movie|undefined;
    error: string;
}

class App extends Component<MyProps, MyState> {
    state: MyState = {movie: undefined, error: ""};

    async componentDidMount() {
        try {
            const results = await imdb.get({name: 'The Toxic Avenger'}, {apiKey: 'use your api key here'});
            this.setState({movie: results, error: ""});
        } catch (e) {
            this.setState({movie: undefined, error: e.message});
        }
    }

    render() {
        return (
            <div className="top">
                <div className="content">
                    {this.state.movie?.title}
                </div>
                <div className="error">
                    {this.state.error}
                </div>
            </div>
        );
    }
}


export default App;
