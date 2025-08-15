import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

async function run() {
  let app: INestApplication | undefined;
  try {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // GET /tasks (empty array initially)
    const list1 = await request(app.getHttpServer()).get('/tasks').expect(200);
    if (!Array.isArray(list1.body)) throw new Error('GET /tasks should return array');

    // POST /tasks
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Teste' })
      .expect(201);
    const taskId = created.body?.id;
    if (!taskId) throw new Error('Created task missing id');

    // GET /tasks/:id
    await request(app.getHttpServer()).get(`/tasks/${taskId}`).expect(200);

    // PUT /tasks/:id toggle completed
    const updated = await request(app.getHttpServer())
      .put(`/tasks/${taskId}`)
      .send({ completed: true })
      .expect(200);
    if (updated.body?.completed !== true) throw new Error('Task not marked completed');

    // DELETE /tasks/:id
    await request(app.getHttpServer()).delete(`/tasks/${taskId}`).expect(200);

    // GET /tasks/:id should be 404 now
    await request(app.getHttpServer()).get(`/tasks/${taskId}`).expect(404);

    // All good
    // eslint-disable-next-line no-console
    console.log('Smoke OK');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Smoke FAILED', err);
    process.exit(1);
  } finally {
    if (app) await app.close();
  }
}

run();
