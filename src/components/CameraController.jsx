import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

const CameraController = () => {
    const { camera } = useThree();
    useEffect(() => {
        camera.lookAt(0, 0, 0);
    }, [camera]);
    return null;
};

export default CameraController;
