(function (root, factory) {
	if (typeof define == "function" && define.amd)
		define(["graphjs/Graph"], factory);
	else if (typeof exports == "object")
		module.exports = factory(require("graphjs/Graph"));
	else
		root.LocalStorageRepo = factory(root.Graph);
}(this, function (Graph) {
	function Context(Entity) {
		this.map = {};
		this.Entity = Entity;
		this.key = this.Entity.scheme.uniqKey;
	}

	Context.prototype = {
		get: function (rawData) {
			var id = rawData[this.key];

			if (!id) {
				return new this.Entity();
			} else if (!this.map[id]) {
				this.map[id] = new this.Entity();
				return this.map[id];
			} else {
				return this.map[id];
			}
		},
		add: function (entity) {
			var id = entity[this.key]

			if (id) {
				if (this.map[id] && this.map[id] !== entity) {
					throw new Error("The context already contains an object with ID " + id);
				}
				this.map[id] = entity;
			} else {
				throw new Error("Entity doesn't have an ID.");
			}
		},
		remove: function (entity) {
			delete this.map[entity[this.key]];
		}
	};

	var LocalStorageRepo = {
		findAll: function () {
			var predicate = {},
				output = [],
				parsed;

			for (var i = 0; i < arguments.length; i++) {
				for (var key in arguments[i]) {
					predicate[key] = arguments[i][key];
				}
			}

			outer:
			for (var x in this.map) {
				if (x !== "index") {
					for (var key in predicate) {
						if (this.map[x][key] !== predicate[key])
							continue outer;
					}
					parsed = Graph.parse(this.entity, this.map[x]);
					this.map[x] = parsed;
					output.push(parsed);
				}
			}

			return output;
		},
		findOne: function (id) {
			if (this.map[id]) {
				var parsed = Graph.parse(this.entity, this.map[id]);
				this.map[id] = parsed;
				return parsed;
			} else {
				return null;
			}
		},
		add: function (entity) {
			var id = entity[this.uniqKey];
			if (id) {
				this.map[id] = entity;
				this.context.add(entity);
			} else {
				this.unsaved.push(entity);
			}
		},
		save: function () {
			var id = this.map.index++,
				unsavedObj;

			for (var i = 0; i < this.unsaved.length; i++) {
				unsavedObj = this.unsaved[i];
				unsavedObj[this.uniqKey] = id;
				this.map[id] = unsavedObj;
				this.context.add(this.map[id]);
			}

			localStorage.setItem(this.collectionName, JSON.stringify(this.map));
			this.unsaved.splice(0, this.unsaved.length);
		},
		remove: function (entity) {
			delete this.map[entity[this.uniqKey]];

		},
		entity: Object,
		collectionName: "objects",
		breed: function (props) {
			var output = Object.create(this);
			for (var x in props) {
				output[x] = props[x];
			}
			var str = localStorage.getItem(output.collectionName);
			output.map = str ? JSON.parse(str) : { index: 1 };
			output.uniqKey = output.entity.scheme.uniqKey;
			output.unsaved = [];
			output.context = output.entity.context = new Context(output.entity);
			return output;
		}
	};

	return LocalStorageRepo;
}));