const url = require('url'),
    open = require('open'),
    {
        VK
    } = require('vk-io');

const {
	CoinBot,
	State
} = require('./coinBot');

const {
    con,
    ccon,
    setColorsM,
    formatScore,
    rl,
    existsFile,
    existsAsync,
    writeFileAsync,
    appendFileAsync,
    setTerminalTitle,
    getVersion,
    infLog,
    onUpdates,
    beep,
} = require('./helpers');

let {
    BOTS
} = require('./config.js');

let {
    autobeep,
    offColors,
    disableUpdates
} = require('./settings')

let
    updatesEv = false,
    updatesInterval = 60,
    updatesLastTime = 0;

onUpdates(msg => {
    if (!updatesEv && !disableUpdates)
        updatesEv = msg;
    con(msg, "white", "Red");
});

let globalToken = "";
let bots = BOTS.map((cfg, i) => {
    let bot = new CoinBot(cfg, i + 1);
    globalToken = globalToken || bot.vk_token;
    return bot;
});

let vk = new VK();
vk.token = globalToken;

async function getUserId(user){
    try {
        let userinfo = await vk.api.users.get({
            user_ids: user
        });
        return userinfo[0].id;
    } catch (e) {
        con("API error: " + e.message, true);
        return 0;
    }
}

let selBot = -1;

let showStatus = setInterval(_ => {
	let totalCoins = 0,
	    totalSpeed = 0,
        running = 0;
    for (let i = 0; i < bots.length; i++) {
        if (bots[i].state == State.RUNNING){
            running++;
            totalCoins += bots[i].getCoins();
            totalSpeed += bots[i].getSpeed();
        }
        if (bots[i].showStatus) {
            bots[i].conStatus();
        }
    }
    con("Работает " + running + " ботов из " + bots.length, "cyan");
    con("Всего коинов: " + formatScore(totalCoins, true), "cyan");
    con("Общая скорость: " + formatScore(totalSpeed, true) + " коинов/тик", "cyan");
}, 1e4);

rl.on('line', async (line) => {
    let id;
	switch (line.trim().toLowerCase()) {
        case '':
            break;
            
        case "?":
        case "help":
            ccon("-- VCoinX --", "red");
            ccon("showall - показать статус всех ботов.");
            ccon("sel(ect) - выбрать бота.");
            ccon("info - отображение основной информации.");
            ccon("debug - отображение тестовой информации.");
            ccon("stop(pause)	- остановка майнера.");
            ccon("start(run)	- запуск майнера.");
            ccon("(b)uy	- покупка улучшений.");
            ccon("(p)rice - отображение цен на товары.");
            ccon("tran(sfer) / pay	- перевод игроку.");
            ccon("hideupd(ate) - скрыть уведомление об обновлении.");
            ccon("getscore(gs) - узнать количество коинов у другого пользователя.");
            ccon("(auto)beep  - автоматическое проигрывание звука ошибки при ошибках.");
            ccon("to - указать ID и включить авто-перевод средств на него.");
            ccon("ti - указать интервал для авто-перевода (в секундах).");
            ccon("tsum - указать сумму для авто-перевода (без запятой).");
            ccon("autobuy(ab) - изменить статус авто-покупки.");
            ccon("autobuyitem - указать предмет(ы) для авто-покупки.");
            ccon("smartbuy(sb) - изменить статус умной покупки.");
            ccon("psb - установить процент от количества коинов, который будет выделяться на умную покупку.");
            ccon("setlimit(sl) - установить лимит коинов / тик, до которого будет работать умная / автопокупка");
            ccon("color - изменить цветовую схему консоли.");
            break;
            
        case 'color':
            setColorsM(offColors = !offColors);
            ccon("Цвета " + (offColors ? "от" : "в") + "ключены. (*^.^*)", "blue");
            break;

        case "hideupd":
        case "hideupdate":
            ccon("Уведомления об обновлении " + (!disableUpdates ? "скрыт" : "показан") + "ы. (*^.^*)");
            disableUpdates = !disableUpdates;
            break;
        
        case 'autobeep':
        case 'beep':
            autobeep = !autobeep;
            ccon("Автоматическое проигрывание звука при ошибках " + autobeep ? "включено" : "отключено" + ".");
            break;

        case 'gs':
        case 'getscore':
            id = await rl.questionAsync("ID пользователя: ");
            if (id.match(/^\d+$/)) {
                id = parseInt(id)
            } else {
                id = await getUserId(id);
            }
            let ok = false;
            for (let i = 0; i < bots.length; i++){
                if (bots[i].state == State.RUNNING){
                    ok = true;
                    try {
                        let gscore = await bots[i].coinWS.getUserScores([id]);
                        con("Текущий баланс пользователя @id" + id.toString() + ": " + formatScore(gscore[id], true) + " коинов.");
                    } catch (e) {
                        console.error("Ошибка при получении баланса:", e);
                    }
                    break;
                }
            }
            if (!ok) {
                con("Нет работающих ботов!", true)
            }
            break;
        
        case 'sel':
        case 'select':
            let item = await rl.questionAsync("ID бота: ");
            id = parseInt(item);
            if (!isNaN(id) && id > 0 && id <= bots.length) {
                selBot = id - 1;
                ccon("Выбран бот #"+id)
            }
            break;
            
        case 'showall':
            for (let i = 0; i < bots.length; i++) {
                bots[i].conStatus();
            }
            break;
    }
	
    if (selBot != -1) {
        let temp, item;
        
        switch (line.trim().toLowerCase()) {
            case '':
                break;
    
            case 'debuginformation':
            case 'debuginfo':
            case 'debug':
                bots[selBot].showDebug();
                break;
    
            case 'i':
            case 'info':
                bots[selBot].showInfo();
                break;
    
            case "stop":
            case "pause":
                bots[selBot].stop();
                break;
    
            case "start":
            case "run":
                bots[selBot].start();
                break;
    
            case 'b':
            case 'buy':
                bots[selBot].showPrices();
                item = await rl.questionAsync("Введи название ускорения [cursor, cpu, cpu_stack, computer, server_vk, quantum_pc, datacenter]: ");
                await bots[selBot].buy(item.split(" "));
                break;
    
            case 'autobuyitem':
            case 'autobuyitems':
                item = await rl.questionAsync("Введи название ускорения для автоматической покупки [cursor, cpu, cpu_stack, computer, server_vk, quantum_pc, datacenter]: ");
                bots[selBot].setABItems(item.split(" "));
                break;
    
            case 'ab':
            case 'autobuy':
                bots[selBot].switchAB();
                break;
    
            case 'sb':
            case 'smartbuy':
                bots[selBot].switchSB();
                break;

            case 'psb':
                item = await rl.questionAsync("Введи процентное соотношение, выделяемое под SmartBuy: ");
                bots[selBot].setPSB(parseInt(item));
                break;

            case 'sl':
            case 'setlimit':
                item = await rl.questionAsync("Введите новый лимит коинов / тик для SmartBuy & AutoBuy: ");
                let lim = parseFloat(item.replace(',', '.'));
                bots[selBot].setLimit(lim);
                break;
                
            case 'to':
                id = await rl.questionAsync("ID получателя: ");
                if (id.match(/^\d+$/)) {
                    id = parseInt(id)
                } else {
                    id = await getUserId(id);
                }
                bots[selBot].setTransferTo(id);
                break;
    
            case 'ti':
                item = await rl.questionAsync("Введите интервал: ");
                bots[selBot].setTI(parseInt(item));
                break;
    
            case 'tsum':
                item = await rl.questionAsync("Введите сумму: ");
                bots[selBot].setTS(parseInt(item));
                break;
    
            case 'tperc':
                bots[selBot].setTP(parseInt(item));
                break;
    
            case 'p':
            case 'price':
            case 'prices':
                bots[selBot].showPrices();
                break;
    
            case 'pay':
            case 'tran':
            case 'transfer':
                let count = await rl.questionAsync("Количество: ");
                id = await rl.questionAsync("ID получателя: ");
                if (id.match(/^\d+$/)) {
                    id = parseInt(id)
                } else {
                    id = await getUserId(id);
                }
                let conf = "";
                if (id > 0) {
                    conf = await rl.questionAsync("Вы уверены? [yes]: ");
                }
                if (conf.toLowerCase().replace(/^\s+|\s+$/g, '') != "yes" || id <= 0 || count <= 0)
                    return con("Отправка не была произведена, вероятно, один из параметров был указан неверно.", true);
                await bots[selBot].transfer(id, count);
                break;
        }
    }
});

// ~ argument parsing ~ //

for (var argn = 2; argn < process.argv.length; argn++) {
    let cTest = process.argv[argn],
        dTest = process.argv[argn + 1];

    switch (cTest.trim().toLowerCase()) {

        case '-black':
            {
                con("Цвета отключены (*^.^*)", "blue");
                setColorsM(offColors = !offColors);
                break;
            }
        
        case '-noupdates':
            ccon("Уведомления об обновлении скрыты. (*^.^*)");
            disableUpdates = true;
            break;
        
        case '-h':
        case '-help':
            {
                ccon("-- VCoinX arguments --", "red");
                ccon("-help			- помощь.");
                ccon("-black      - отключить цвета консоли.");
                ccon("-noupdates  - отключить сообщение об обновлениях.");
                process.exit();
                continue;
            }
        default:
            con('Unrecognized param: ' + cTest + ' (' + dTest + ') ');
            break;
    }
}
