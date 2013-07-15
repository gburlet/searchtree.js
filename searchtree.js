/*
Copyright (C) 2011 by Gregory Burlet

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function SearchTree () {
    this.rootNode = null;
    this.numNodes = 0;
}

function SearchTreeNode (payload) {
    this.payload = payload;
    this.children = {};

    // cache the number of children of this node
    // since there is no length or size function for
    // JavaScript objects
    this.numChildren = 0;
}

SearchTree.prototype = {
    
    setRootNode: function(rootNode) {
        this.rootNode = rootNode;
    },

    insert: function(edges, payload) {
        if (!this.rootNode) {
            if (edges.length) {
                this.setRootNode(new SearchTreeNode(null));
                this.numNodes++;
            }
            else {
                this.setRootNode(new SearchTreeNode(payload));
                this.numNodes++;
                return;
            }
        }

        // start search at the root node
        this.rootNode.insert(edges, payload);
    },

    remove: function(edges) {
        this.rootNode.remove(edges);
    },

    destroyTree: function() {
        this.rootNode = null;
        this.numNodes = 0;
    },

    search: function(edges, returnPrefix) {
        var curNode = this.rootNode;
            for (var i = 0; i < edges.length; i++) {
            var e = edges[i];
            if (e in curNode.children) {
                // traverse to child
                curNode = curNode.children[e];
            }
            else if (returnPrefix) {
                // this edges is not present in the tree
                // return the closest matching e
                return {result: curNode.payload, prefix: true};
            }
            else {
                return null;
            }
        }

        // the edge list has been traversed,
        // return the payload
        return {result: curNode.payload, prefix: false};
    },

    /*
     * Perform depth-first search to retrieve a node with the given
     * payload. Also returns the edge weights along the path from the 
     * root node to the target node.
     */
    dfs: function(payload) {
        function dfsRecurse(payload, curNode, pi) {
            if (curNode.payload.typeid == payload) {
                return curNode;
            }
            else {
                var res = null;
                for (var e in curNode.children) {
                    if (res) {
                        break;
                    }

                    pi[curNode.children[e].payload.typeid] = {e: e, parent: curNode.payload.typeid};
                    res = dfsRecurse(payload, curNode.children[e], pi);
                }

                return res;
            }
        }

        /*
         * from the list of predecessors, return the edge weights
         * along the path from the root node to the target node
         */
        function backtrackEdges(pi, payload) {
            var edges = new Array();
            var p = payload;
            while (p in pi) {
                edges.push(pi[p].e);
                p = pi[p].parent;
            }

            return edges.reverse();
        }

        var pi = new Object();
        var searchRes = {
            node: dfsRecurse(payload, this.rootNode, pi),
            edges: backtrackEdges(pi, payload)
        };

        return searchRes;
    },

    stringify: function() {
        return JSON.stringify(this);
    },

    populateFromJSON: function(string) {
        var json = JSON.parse(string);
        this.rootNode = json.rootNode;
        this.numNodes = json.numNodes;
    }
};

SearchTreeNode.prototype = {

    insert: function(edges, payload) {
        var e = edges.splice(0,1);

        // termination condition
        if (!edges.length) {
            if (e in this.children) {
                // overwrite payload if a node exists with this e
                this.children[e].payload = payload;
            }
            else {
                // insert a new leaf with the given payload
                this.children[e] = new SearchTreeNode(payload);
                this.numChildren++;
            }
        }
        else {
            if (!(e in this.children)) {
                // insert node with no payload
                this.children[e] = new SearchTreeNode(null);
                this.numChildren++;
            }
            
            this.children[e].insert(edges, payload);
        }
    },

    remove: function(edges) {
        var e = edges.splice(0,1);

        // termination condition
        if (!edges.length) {
            if (e in this.children) {
                if (this.children[e].numChildren) {
                    // the node is not a leaf, do not delete the subtree
                    // but remove payload.
                    this.children[e].payload = null;
                }
                else {
                    // the node has no children, remove the leaf
                    delete this.children[e];
                    this.numChildren--;
                }
            }
        }
        else if (e in this.children) {
            this.children[e].remove(edges);
        }
    },

    getChildren: function() {
        var childList = new Array();
        for (var e in this.children) {
            childList.push(this.children[e]);
        }

        return childList;
    }
};
