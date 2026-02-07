import React from 'react';

const Card = ({ card, isSelected, onClick, isFaceDown }) => {
    // Mapping suits to text/unicode
    // Suuits from backend: 0->SPADE, 1->CLUB, 2->DIAMOND, 3->HEART
    // Ranks: 3-15

    if (isFaceDown) {
        return (
            <div
                className="card card-back"
                onClick={onClick}
                style={{ margin: '-20px' }} // Overlap effect for piles
            ></div>
        );
    }

    const { rank, suit } = card;

    const suitIcons = ['♠', '♣', '♦', '♥'];
    const rankTexts = {
        11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2'
    };

    const displayRank = rankTexts[rank] || rank;
    const displaySuit = suitIcons[suit];
    const isRed = suit === 2 || suit === 3;

    return (
        <div
            className={`card ${isRed ? 'red' : 'black'} ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            // Negative margin for hand spreading effect
            style={{ marginLeft: '-40px' }}
        >
            <div className="card-top-left">{displayRank}</div>
            <div className="card-center">{displaySuit}</div>
            <div className="card-bottom-right">{displayRank}</div>
        </div>
    );
};

export default Card;
