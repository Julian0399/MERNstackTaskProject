import crypto from 'crypto';

const hashToken = async (token) => {
    return crypto.createHash('sha256').update(token,toString()).digest('hex');
}

export default hashToken;