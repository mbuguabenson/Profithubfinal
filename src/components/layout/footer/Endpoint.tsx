import { standalone_routes } from '@/components/shared';
import Text from '@/components/shared_ui/text';
import { LocalStorageConstants, LocalStorageUtils } from '@deriv-com/utils';

const Endpoint = () => {
    const serverURL = LocalStorageUtils.getValue<string>(LocalStorageConstants.configServerURL);

    if (serverURL) {
        return (
            <Text className='app-footer__endpoint' color='red' size='s'>
                The server{' '}
                <a className='app-footer__endpoint-text' href={standalone_routes.endpoint}>
                    endpoint
                </a>{' '}
                {`is: ${serverURL}`}
            </Text>
        );
    }
    return null;
};

export default Endpoint;
