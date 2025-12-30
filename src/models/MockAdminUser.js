// Temporary in-memory storage for testing (replaces MongoDB)
const tempStorage = {
    users: [],
    nextId: 1
};

// Mock AdminUser model for testing
class MockAdminUser {
    static async findOne(query) {
        const user = tempStorage.users.find(user => 
            (query.email && user.email === query.email) ||
            (query.role && user.role === query.role) ||
            (query._id && user._id.toString() === query._id.toString())
        );
        
        if (!user) return null;
        
        // Create a new instance with all methods
        const instance = new MockAdminUser();
        Object.assign(instance, user);
        return instance;
    }

    static async findById(id) {
        const user = tempStorage.users.find(user => user._id.toString() === id.toString());
        
        if (!user) return null;
        
        // Create a new instance with all methods
        const instance = new MockAdminUser();
        Object.assign(instance, user);
        return instance;
    }

    static async create(userData) {
        const user = {
            _id: tempStorage.nextId++,
            ...userData,
            createdAt: new Date(),
            lastLogin: new Date(),
            isActive: true
        };
        tempStorage.users.push(user);
        
        // Create a new instance with all methods
        const instance = new MockAdminUser();
        Object.assign(instance, user);
        return instance;
    }

    static async find() {
        return tempStorage.users.map(user => {
            const instance = new MockAdminUser();
            Object.assign(instance, user);
            return instance;
        });
    }

    async save() {
        // Update the user in storage
        const index = tempStorage.users.findIndex(user => user._id === this._id);
        if (index !== -1) {
            tempStorage.users[index] = { ...this };
        } else {
            // If not found, add it
            tempStorage.users.push({ ...this });
        }
        return this;
    }

    async matchPassword(password) {
        return this.password === password; // Simple comparison for testing
    }

    hasPermission(permission) {
        return this.permissions && this.permissions[permission] === true;
    }

    async updateLastLogin() {
        this.lastLogin = new Date();
        return this;
    }
}

module.exports = MockAdminUser;
