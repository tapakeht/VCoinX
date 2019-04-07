module.exports = {
	BOTS: [
	    {
            TOKEN: "token_here",
            DONEURL: "https://coin.vkforms.ru/index.html/0",
            TI: 1800, //интервал автоперевода
            TSUM: 10000, //сумма автоперевода
            //TPERC: 75, //автоперевод в процентах
            TO: 123456, //ID для автоперевода
            AUTOBUY: true, 
            AUTOBUYITEMS: [
                "quantum_pc",
                "datacenter"
            ],
            //SMARTBUY: true,
            SHOW_STATUS: true, //показывать количество коинов и место в топе
            SHOW_T_IN: true, //показывать автопереводы от этого бота
            SHOW_T_OUT: true, //показывать полученные переводы
            SHOW_BUY: true //показывать сообщения об автопокупке / умной покупке
        },
        {
            TOKEN: "token2_here",
            DONEURL: "https://coin.vkforms.ru/index.html/1",
            TPERC: 75, //автоперевод в процентах
            TO: 654321, //ID для автоперевода
            SMARTBUY: true,
            SHOW_STATUS: true //показывать количество коинов и место в топе
        }
    ]
};
