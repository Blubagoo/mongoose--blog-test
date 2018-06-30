'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

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

function generateTitle() {
	const titles = ['Days Go By', 'Stranger Things', 'Atlas Explored', 'Tommy Two Tone: The Star'];
	
	return titles[Math.floor(Math.random() * titles.length)];
}

function generateContent() {
	const content = ['Lorem Sum Ipsum', 'Ipsum Sum Lorem', 'Sum Ipsum Lorem', 'Lorem Ipsum Sum'];
	
	return content[Math.floor(Math.random() * content.length)];
}

function generateAuthor() {
	const authors = ['Janey Briley', 'Jon Faraday', 'Wade Watts', 'Baba O Riley'];
	
	return authors[Math.floor(Math.random() * authors.length)];
}

function generateBlogData() {
	return {
		title: generateTitle(),
		content: generateContent(),
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
					expect(res.body.blogs).to.have.lengthOf.at.least(1);
					return BlogPost.count();
				});
		});

		it('should return blogs with right info', function() {
			let resBlog;


			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.blogs).to.be.a('array');
					expect(res.body.blogs).to.have.lengthOf.at.least(1);

					res.body.blogs.forEach(function(blog) {
						expect(blog).to.be.a('object');
						expect(blog).to.include.keys('id', 'title', 'content', 'author', 'created');
					});
					resBlog = res.body.blogs[0];

					return BlogPost.findById(resBlog.id);
				})
				.then(function(blog) {
					expect(resBlog.id).to.equal(blog.id);
					expect(resBlog.title).to.equal(blog.title);
					expect(resBlog.content).to.equal(blog.content);
					expect(resBlog.author).to.equal(blog.author);
					expect(resBlog.created).to.equal(blog.created);
				});
		});
	});
});