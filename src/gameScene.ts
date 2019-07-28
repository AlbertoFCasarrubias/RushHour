import "phaser";
import {makeLogger} from "ts-loader/dist/types/logger";

export class GameScene extends Phaser.Scene {
    delta: number;
    lastStarTime: number;
    starsCaught: number;
    starsFallen: number;
    sand: Phaser.Physics.Arcade.StaticGroup;
    info: Phaser.GameObjects.Text;
    tables: any;
    cashiers: any;
    pad: any;
    stick: any;
    customers: any = [];
    lines: any = [0, 0, 0, 0];
    maxCustomersPerLine = 4;
    gameOver = false;
    collisionTimer: any;
    cajero: any;
    cursors: any;
    velocitityCajero: any = 150;
    cajasOcupadas: any = [0, 0, 0, 0];
    colliderClienteCaja: any = [false, false, false, false];
    colliderClienteCliente = {};

    doneIntervalTime = 500;
    doneInterval: any;

    constructor() {
        super({
            key: "GameScene"
        });
    }

    init(/*params: any*/): void {
        this.delta = 3 * 1000;
        this.lastStarTime = 0;
        this.starsCaught = 0;
        this.starsFallen = 0;
    }

    preload(): void {
        //this.load.setBaseURL("https://raw.githubusercontent.com/mariyadavydova/" + "starfall-phaser3-typescript/master/");
        this.load.atlas('dpad', 'assets/dpad.png', 'assets/dpad.json');
        this.load.image("customer", "assets/customer.jpg");
        this.load.image("cashier", "assets/cashier.png");
        this.load.image("cajero", "assets/cashier.png");

        this.load.image('sky', 'assets/sky.png');
        this.load.image("star", "assets/star.png");
        this.load.image("table", "assets/table.png");
        this.load.image("sand", "assets/sand.jpg");
    }

    create(): void {
        this.add.image(400, 300, 'sky');
        // this.pad = this.game.plugins.add(Phaser.VirtualJoystick);
        // this.stick = this.pad.addDPad(0, 0, 200, 'dpad');
        // this.stick.alignBottomLeft(0);

        this.tables = this.physics.add.staticGroup();
        for (var i = 0; i < 20; i++) {
            this.tables.create(i * 32, 100, 'table').refreshBody();
            this.tables.create(i * 32, 250, 'table').refreshBody();
            this.tables.create(i * 32, 400, 'table').refreshBody();
            this.tables.create(i * 32, 550, 'table').refreshBody();
        }

        this.cashiers = this.physics.add.staticGroup();
        this.cashiers.create(580, 50, 'cashier');
        this.cashiers.create(580, 200, 'cashier');
        this.cashiers.create(580, 350, 'cashier');
        this.cashiers.create(580, 500, 'cashier');

        //this.cajero.setCollideWorldBounds(true);
        this.cajero = this.physics.add.image(720, 250, "customer");
        this.physics.add.collider(this.cajero, this.cashiers, this.onCajeroCollide(), null, this);


        this.cursors = this.input.keyboard.createCursorKeys();

        //this.customers.push(this.physics.add.image(-70,160, "customer"));
        //this.customers.push(this.physics.add.image(-70,160, "customer"));

        //this.physics.add.collider(this.customers, this.customers, this.onCustomersCollide(this.customers[1]), null, this);


        //this.physics.add.collider(this.tables);


        /*
        this.sand = this.physics.add.staticGroup({
          key: 'sand',
          frameQuantity: 20
        });
        Phaser.Actions.PlaceOnLine(this.sand.getChildren(),
          new Phaser.Geom.Line(20, 580, 820, 580));
        this.sand.refresh();

        this.info = this.add.text(10, 10, '',
          { font: '24px Arial Bold', fill: '#FBFBAC' });*/
    }

    update(time: number): void {
        var diff: number = time - this.lastStarTime;
        if (diff > this.delta) {
            this.lastStarTime = time;
            if (this.delta > 500) {
                this.delta -= 20;
            }
            this.emitCustomer();
            this.areLinesFull();
        }

        /*
        if (this.cursors.left.isDown)
        {
          this.cajero.setVelocityX(-160);
          //player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown)
        {
          this.cajero.setVelocityX(160);
          //player.anims.play('right', true);
        }
        else
        {
          this.cajero.setVelocityX(0);
          //player.anims.play('turn');
        }
        if (this.cursors.up.isDown && this.cajero.body.touching.down)
        {
          this.cajero.setVelocityY(-530);
        }
        */

        if (this.cursors.left.isDown) {
            //this.cajero.setVelocityX(-160);
            //player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            //this.cajero.setVelocityX(160);
            //player.anims.play('right', true);
        } else if (this.cursors.up.isDown) {
            this.cajero.setVelocityY(this.velocitityCajero * -1);
        } else if (this.cursors.down.isDown) {
            this.cajero.setVelocityY(this.velocitityCajero);
        } else {
            this.cajero.setVelocityY(0);
        }
    }

    private onClick(star: Phaser.Physics.Arcade.Image): () => void {
        return function () {
            star.setTint(0x00ff00);
            star.setVelocity(0, 0);
            this.starsCaught += 1;
            this.time.delayedCall(100, function (star) {
                star.destroy();
            }, [star], this);
        }
    }

    private onFall(star: Phaser.Physics.Arcade.Image): () => void {
        return function () {
            star.setTint(0xff0000);
            this.starsFallen += 1;
            this.time.delayedCall(100, function (star) {
                star.destroy();
                if (this.starsFallen > 2) {
                    this.scene.start("ScoreScene", {starsCaught: this.starsCaught});
                }
            }, [star], this);
        }
    }

    private emitStar(): void {
        var star: Phaser.Physics.Arcade.Image;
        var x = Phaser.Math.Between(25, 775);
        var y = 26;
        star = this.physics.add.image(x, y, "star");

        star.setDisplaySize(50, 50);
        star.setVelocity(0, 200);
        star.setInteractive();

        star.on('pointerdown', this.onClick(star), this);
        this.physics.add.collider(star, this.sand, this.onFall(star), null, this);
    }

    private emitCustomer() {
        var customer: Phaser.Physics.Arcade.Image;
        var x = -100;
        var y;
        var table = Phaser.Math.Between(0, 3);

        switch (table) {
            case 0:
                y = 10;
                break;

            case 1:
                y = 160;
                break;

            case 2:
                y = 310;
                break;

            case 3:
                y = 460;
                break;
        }

        this.lines[table]++;

        const velocity = Phaser.Math.Between(100, 200);

        customer = this.physics.add.image(x, y, "customer");
        customer.setVelocity(velocity, 0);

        customer['table']       = table;
        customer['velocity']    = velocity;
        customer['uid']         = table + new Date().getTime();

        this.customers.push(customer);

        this.colliderClienteCaja[table]                 = this.physics.add.collider(customer, this.cashiers, this.onCustomersCollideCashier(customer, table), null, this);
        this.colliderClienteCliente[customer['uid']]    = this.physics.add.collider(customer, this.customers, this.onCustomersCollide(customer, table), null, this);


    }

    private addCollisionLine(table) {
        clearTimeout(this.collisionTimer);
        this.collisionTimer = setTimeout(() => {

        }, 500);

    }

    private onCustomersCollideCashier(customer, table): () => void {
        return function () {
            //console.log('ONCUSTOMERSCOLLIDECASHIER', customer, table);

            customer.setTint(0xff0000);
            customer.setVelocity(0, 0);
            customer.body.enabled = false;
            this.colliderClienteCaja[table].active = false;
            this.cajasOcupadas[table] = 1;

            this.atenderCliente(table, customer);
        }
    }

    atenderCliente(table, customer) {
        this.colliderClienteCaja[table].active = true;

        setTimeout(() =>{

            customer.destroy();
            this.cajasOcupadas[table] = 0;

            clearInterval(this.doneInterval);
            this.doneInterval = setTimeout(()=>{
                this.lines[table]--;
                console.log('this.lines ' , this.lines);
            },this.doneIntervalTime);

            //this.avanzarFilaALaCaja(customer, table)

        } , 11 * 1000);
    }

    private onCajeroCollide(): () => void {
        return function () {
            console.log('cajero choco');
        }

    }

    private onCustomersCollide(customer, table): () => void {
        return function () {
            customer.setTint(0x00ff00);
        }
    }

    private avanzarFilaClientes(table)
    {
        //console.log(' ');
        //console.log('avanzar fila clientes');

        for(const collider of Object.keys(this.colliderClienteCliente))
        {
            //this.colliderClienteCliente[collider].active = true;
            //console.log(this.colliderClienteCliente[collider].active);
        }

    }

    private avanzarFilaALaCaja(customer, table)
    {
        for(const cust of this.customers)
        {
            if(cust.body  )
            {
                cust.body.enabled = true;
            }
        }
    }

    private areLinesFull() {

        for (const line of this.lines) {
            if (line >= this.maxCustomersPerLine) {
                this.gameOver = true;
            }
        }

        console.log(this.lines, 'GAMEOVER ', this.gameOver);
        if (this.gameOver) {
            setTimeout(() => {
                console.log('timeout');
                this.scene.start("ScoreScene", {starsCaught: this.starsCaught});
            }, 3000);

        }


    }
};
