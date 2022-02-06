import React from "react";

import Header from "../Header/Header";
import GameGrid from "../GameGrid/GameGrid";
import Modal from "../Modal/Modal";
import listen, { setalertHandler }from "./Audio";

import "./Verble.css";

// Alphabetised Wordle data sets from https://gist.github.com/cfreshman
import solutions from "./words_solutions.txt";
import valid_guesses from "./wordle_guesses.txt";
import valid_answers from "./wordle_answers.txt";

const TOKEN_URL = "https://verble.herokuapp.com/token";
const SAMPLE_RATE = 16000;

function Indicator(props) {

    if (props.error) {
        setTimeout(
            () => props.resetCb(),
            400
        );
    }

    return (

        <div className={`Verble-micContainer ${props.error ? "Verble-error" : ""}`}>
            <span class="material-icons Verble-mic">mic</span>
        </div>
        
    );
    
}

class Verble extends React.Component {

    solution = null;

    constructor(props) {

        super(props);

        this.state = {
            finished: false,
            primedWord: null,
            words: [],
            modalMessage: null,
            vocalError: false
        }

        let today = new Date().getTime() - 18000000;
        let firstDay = new Date(2021, 5, 19, 0, 0, 0, 0).getTime();
        let index = Math.floor((today - firstDay) / 864e5);

        fetch(solutions)
        .then(solution_res => solution_res.text())
        .then(solns => this.solution = solns.split(/(?:\r?\n)+/).map(word => word.trim())[index]);
    }

    vocalError() {
        this.setState({vocalError: true});
    }

    componentDidMount() {
        let valid_words = new Set();

        const prime_cb = word => this.prime(word, valid_words);
        const play_cb = () => this.play();
        const finish_cb = () => this.finish(); 
        const err_cb = () => this.vocalError();

        // Get all valid words
        fetch(valid_guesses)
        .then(guess_res => guess_res.text())
        .then(guesses => {
            fetch(valid_answers)
            .then(answer_res => answer_res.text())
            .then(answers => {

                guesses.split(/(?:\r?\n)+/).forEach(word => valid_words.add(word.trim()));
                answers.split(/(?:\r?\n)+/).forEach(word => valid_words.add(word.trim()));
                console.log(`Loaded ${valid_words.size} words`);
        
                listen(TOKEN_URL, SAMPLE_RATE, prime_cb, play_cb, finish_cb, err_cb);
            });
        });

        setalertHandler(msg => this.setState({modalMessage: msg}));
    }

    prime(word, valid_words) {

        if (word.length === this.solution.length && valid_words.has(word)) {
            this.setState( { primedWord: word } );
            return true;
        }
        
        return false;

    }

    play() {

        if (this.state.primedWord) {

            let words = this.state.words;
            words.push(this.state.primedWord);
    
            this.setState({
                words: words,
                primedWord: null
            });

            return true;
        }

        return false;

    }

    finish() {

        // Game is finished if the words match or the number of guesses is exceeded
        if (this.state.primedWord && (this.state.primedWord === this.solution || this.state.words.length === this.props.guesses)) {
            return true;
        }

        return false;

    }

    renderModal() {

        if (this.state.modalMessage) {

            return (

                <Modal emptyHandler={() => this.setState({modalMessage: null})}>
                    <div>{this.state.modalMessage}</div>
                </Modal> 

            );

        }

    }

    render() {

        return (

            <div className="Verble-container">

                <Header />

                <div className="Verble-gridContainer">
                    <Indicator error={this.state.vocalError} resetCb={() => this.setState({vocalError: false})}/>
                    <GameGrid primedWord={this.state.primedWord} words={this.state.words} target={this.solution} guesses={this.props.guesses}/>
                </div>

                
                {/* <TestBox playHandler={() => this.play()} primeHandler={word => this.prime(word)}/> */}

                {this.renderModal()}               

            </div>

        );

    }

}

export default Verble;