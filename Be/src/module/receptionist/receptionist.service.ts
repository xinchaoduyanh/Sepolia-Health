import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceptionistService {
  createReceptionistProfile(userId: number) {
    return 'This action adds a new receptionist';
  }

  findAll() {
    return `This action returns all receptionist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} receptionist`;
  }

  update(id: number) {
    return `This action updates a #${id} receptionist`;
  }

  remove(id: number) {
    return `This action removes a #${id} receptionist`;
  }
}
