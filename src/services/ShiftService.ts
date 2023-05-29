import { GenericStatus } from '../models/dtos';
import { ShiftRepository } from '../models/repositories';

export class ShiftService {
  private shiftRepository = new ShiftRepository();

  async changeStatus(guid: string, status: GenericStatus) {
    const updatedShift = await this.shiftRepository.update(guid, status);

    return updatedShift;
  }

  async list() {
    const result = await this.shiftRepository.findAll();

    return result;
  }

  async listShiftClassSchedules(shiftGuid: string) {
    const schedules = await this.shiftRepository.findShiftClassSchedules(
      shiftGuid
    );

    return schedules;
  }
}
