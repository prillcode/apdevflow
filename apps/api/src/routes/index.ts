import { Hono } from 'hono';
import github from './github';
import health from './health';

const routes = new Hono();

routes.route('/github', github);
routes.route('/health', health);

export default routes;
