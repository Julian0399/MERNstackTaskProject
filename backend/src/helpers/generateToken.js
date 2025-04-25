import jwt from 'jsonwebtoken';

// Generate token JWT for user that expires in 30 days

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

export default generateToken;