const truffleAssert = require('truffle-assertions')
const BookStore = artifacts.require("BookStore")
const PurchaseToken = artifacts.require("PurchaseToken")
const StoreFront = artifacts.require("StoreFront")

contract('BookStore',(accounts) => {
    describe('Publishing', async () => {
        //console.log(accounts)
        it("give the author the specified amount of book version copies", async ()=> {
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            //let book_id = 1
            let price = web3.utils.toWei('50','ether')
            let currency = '0x5C1C320298058b9C45E6aB009eFEe25eb8f00d72'//ether addrress
            let quantity = 100

            const author = accounts[5]
            await book_store.publish(quantity, price, currency, { from: author})

            let author_balance = await book_store.balanceOf(author, 1)
            author_balance = parseInt(author_balance)
            assert.equal(author_balance, 100)
        })
        it("increacse the book ID", async ()=>{
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            let price = web3.utils.toWei('50','ether')
            let currency = '0x5C1C320298058b9C45E6aB009eFEe25eb8f00d72'//ether addrress

            const author = accounts[3]

            await book_store.publish(75, price, currency, { from: author})
            await book_store.publish(50, price, currency, { from: author})

            let author_balance = await book_store.balanceOf(author, 2)
            author_balance = parseInt(author_balance)
            assert.equal(author_balance, 50)
        })
        it("currectly sets the price and currency for a book version", async ()=> {
            //firstBook
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            let price = web3.utils.toWei('50','ether')
            let currency = '0x5C1C320298058b9C45E6aB009eFEe25eb8f00d72'//ether addrress
            let quantity = 100

            const author = accounts[5]
            await book_store.publish(quantity, price, currency, { from: author})

            let book_version_price = await book_store.book_version_price(1)
            book_version_price = web3.utils.fromWei(book_version_price,'ether')
            assert.equal(book_version_price, '50')

            //secondBook
            price = web3.utils.toWei('100','ether')
            currency = '0x5C1C320298058b9C45E6aB009eFEe25eb8f00d72'//ether addrress
            quantity = 70
            await book_store.publish(quantity, price, currency, { from: author})

            book_version_price = await book_store.book_version_price(2)
            book_version_price = web3.utils.fromWei(book_version_price,'ether')
            assert.equal(book_version_price, '100')

            let book_version_currency = await book_store.book_version_currency(2)
            assert.equal(book_version_currency, '0x5C1C320298058b9C45E6aB009eFEe25eb8f00d72')
        })
    })

    describe('Purchasing from the author', async () =>{
        it("transfers the purchase token to the author", async () =>{
            //bookId = 1
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            const buyer = accounts[1]
            const purchase_token = await PurchaseToken.new(web3.utils.toWei('1000000', 'ether'), { from:buyer })

            let balance = await purchase_token.balanceOf(buyer)
            balance = web3.utils.fromWei(balance, 'ether')
            assert.equal(balance, '1000000')

            await purchase_token.approve(store_front.address, web3.utils.toWei('1000000','ether'),{from: buyer})

            let price = web3.utils.toWei('5000','ether')
            let check = web3.utils.toChecksumAddress(purchase_token.address)
            let currency = check
            let quantity = 10

            const author = accounts[3]
            await book_store.publish(quantity, price, currency, { from: author})

            await book_store.setApprovalForAll(store_front.address, true,{from: author})

            await store_front.purchaseFromAuthor(1, {from: buyer})
            
            let balanceOfAuthor = web3.utils.fromWei(await purchase_token.balanceOf(author), 'ether')
            assert.equal(balanceOfAuthor,'5000')
           
        })
        it("it transfers a version to the buyer", async () =>{
            //bookId = 1
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            const buyer = accounts[2]
            const purchase_token = await PurchaseToken.new(web3.utils.toWei('1000000', 'ether'), { from:buyer })

            await purchase_token.approve(store_front.address, web3.utils.toWei('1000000','ether'),{from: buyer})
            
            let price = web3.utils.toWei('50','ether')
            let check = web3.utils.toChecksumAddress(purchase_token.address)
            let currency = check
            let quantity = 100

            const author = accounts[3]
            await book_store.publish(quantity, price, currency, { from: author})

            await book_store.setApprovalForAll(store_front.address, true,{from: author})

            await store_front.purchaseFromAuthor(1, {from: buyer})

            let book_version_balance = parseInt(await book_store.balanceOf(buyer,1))
            assert.equal(book_version_balance,1)

            //account2
            purchase_token.transfer(accounts[9], web3.utils.toWei('500000','ether'),{ from: buyer})
            await purchase_token.approve(store_front.address, web3.utils.toWei('1000000','ether'),{from: accounts[9]})
            await store_front.purchaseFromAuthor(1, {from: accounts[9]})

            book_version_balance = parseInt(await book_store.balanceOf(accounts[9],1))
            assert.equal(book_version_balance,1)
            //todo: check the balance of the author
        })
    })
    describe("Security", async () => {
        it("won't allow anyone but store front to call Bookstore#transferFromAuthor", async () =>{
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            let price = web3.utils.toWei('50','ether')
            let currency = '0x5C1C320298058b9C45E6aB009eFEe25eb8f00d72'//ether addrress
            let quantity = 100

            const author = accounts[5]

            await book_store.publish(quantity, price, currency, { from: author})

            await truffleAssert.reverts(book_store.transferFromAuthor(accounts[3],1,{from: accounts[3]}),"Method can only be called by store_front contract")
        })
        it("won't allow anyone but contract owner to set the storeFront", async () =>{
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            await truffleAssert.reverts(book_store.setStoreFront(store_front.address, {from: accounts[7]}),"BookStore: only contract owner can set storeFront")
        })
        it("won't allow anyone but contract owner to set the book store", async () =>{
            const store_front = await StoreFront.new()
            const book_store = await BookStore.new()

            await store_front.setBookStore(book_store.address)
            await book_store.setStoreFront(store_front.address)

            await truffleAssert.reverts(store_front.setBookStore(book_store.address, {from: accounts[7]}),"StoreFront: only contract owner can set storeFront")
        })
    })
})
