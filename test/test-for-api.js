'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlog() {
	console.info('seeding blog data');
	const seedData = [];

	for(let i = 1; i<=10; i++) {
		seedData.push(generateBlogData());
	}
	
	return BlogPost.insertMany(seedData);
}


function generateAuthor() {
	const authors = ['Janey Briley', 'Jon Faraday', 'Wade Watts', 'Baba O Riley'];
	
	return authors[Math.floor(Math.random() * authors.length)];
}

function generateBlogData() {
	return {
		title: faker.lorem.sentence(),
		content: faker.lorem.text(),
		author: generateAuthor()
	}
}
function tearDownDb() {
	console.warn('Deleting Database');

	return mongoose.connection.dropDatabase();
}

describe('Blog Resource Api', function() {

	before(function() {
		
		return runServer(TEST_DATABASE_URL);
	});
	
	beforeEach(function() {
		
		return seedBlog();	    
	});

	afterEach(function() {

		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function() {

		it('should return all blogs', function() {
			let res;

			return chai.request(app)
				.get('/posts')
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.have.lengthOf.at.least(1);
					return BlogPost.count();
				});
		});

		it('should return blogs with right info', function() {
			let resPost;


			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.lengthOf.at.least(1);

					res.body.forEach(function(blog) {
						expect(blog).to.be.a('object');
						expect(blog).to.include.keys('id', 'title', 'content', 'author', 'created');
					});
					resPost = res.body[0];

					return BlogPost.findById(resPost.id);
				})
				.then(function(blog) {
					expect(resPost.id).to.equal(blog.id);
					expect(resPost.title).to.equal(blog.title);
					expect(resPost.content).to.equal(blog.content);
				});
		});
	});
});