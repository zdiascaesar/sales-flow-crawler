"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkQueue = void 0;
const url_1 = require("url");
class LinkQueue {
    constructor(startUrl) {
        this.startUrl = new url_1.URL(startUrl);
        this.queue = [this.startUrl.href];
        this.visited = new Set();
    }
    hasUnvisitedUrls() {
        return this.queue.length > 0;
    }
    getNextUrl() {
        return this.queue.shift();
    }
    markVisited(url) {
        this.visited.add(url);
    }
    isValidUrl(url) {
        try {
            new url_1.URL(url);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    queueLinks($, baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const links = $('a')
                .map((i, el) => $(el).attr('href'))
                .get();
            const newLinks = links.filter(link => {
                try {
                    const fullUrl = new url_1.URL(link, baseUrl);
                    return fullUrl.hostname === this.startUrl.hostname &&
                        !this.visited.has(fullUrl.href) &&
                        !this.queue.includes(fullUrl.href);
                }
                catch (error) {
                    return false;
                }
            });
            this.queue.push(...newLinks);
            return newLinks.length;
        });
    }
    getQueue() {
        return this.queue;
    }
    getVisited() {
        return this.visited;
    }
    getStartUrl() {
        return this.startUrl;
    }
}
exports.LinkQueue = LinkQueue;
