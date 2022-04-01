const Sequelize = require('sequelize');

module.exports = {
    name: 'table',
    public: false,

    rmember(){
        const member = {
            member_id: {
                type: Sequelize.DataTypes.STRING,
                unique: true
            },
            quiet: {
                type: Sequelize.DataTypes.BOOLEAN
            }
        };
        return member;
    },

    rtalk(){
        const rtalk = {
            a_id: {
                type: Sequelize.DataTypes.STRING,
                unique: true
            },
            b_id: {
                type: Sequelize.DataTypes.STRING,
                unique: true
            },
            t_prefix: {
                type: Sequelize.DataTypes.STRING,
                //unique: true
            }
        }
        return rtalk;
    },
    rProvinces(){
        const rProvinces = {
            p_id: {
                type: Sequelize.DataTypes.NUMBER,
                unique: true 
            },
            p_name: {
                type: Sequelize.DataTypes.STRING
            },
            p_level: {
                type: Sequelize.DataTypes.NUMBER
            },
            p_autonom: {
                type: Sequelize.DataTypes.BOOLEAN
            },
            p_lord: {
                type: Sequelize.DataTypes.NUMBER
            },
            p_army_modification: {
                type: Sequelize.DataTypes.STRING
            },
            p_income: {
                type: Sequelize.DataTypes.NUMBER
            }
        }
        return rProvinces;
    },
    rArmies(){
        const rArmies = {
            a_id: {
                type: Sequelize.DataTypes.NUMBER,
                unique: true
            },
            a_faction_id: {
                type: Sequelize.DataTypes.NUMBER
            },
            a_level: {
                type: Sequelize.DataTypes.NUMBER
            },
            a_strength: {
                type: Sequelize.DataTypes.NUMBER
            },
            a_location_id: {
                type: Sequelize.DataTypes.NUMBER
            }
        }
        return rArmies;
    },
    rFactions(){
        const rFactions = {
            f_id: {
                type: Sequelize.DataTypes.NUMBER,
                unique: true
            },
            f_name: {
                type: Sequelize.DataTypes.STRING
            },
            f_player_discord: {
                type: Sequelize.DataTypes.STRING,
                unique: true
            },
            f_gold: {
                type: Sequelize.DataTypes.NUMBER,
                unique: false
            }
        }
        return rFactions;
    },
    rGame(){
        const rGame = {
            round: {
                type: Sequelize.DataTypes.NUMBER,
                unique: true
            },
            current_faction_id: {
                type: Sequelize.DataTypes.NUMBER,
                unique: false
            },
            number_players_to_go: {
                type: Sequelize.DataTypes.NUMBER
            }
        }
        return rGame;
    }

};
