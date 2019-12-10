import axios, {AxiosRequestConfig} from 'axios';
import * as moment from 'moment';
import {NTPClient} from 'ntpclient';

export interface OSMResult {
  boundingbox?: string[] | null;
  class: string;
  display_name: string;
  icon?: string | null;
  importance: number;
  lat: string;
  licence: string;
  lon: string;
  osm_id: number;
  osm_type: string;
  place_id: number;
  type: string;
}

export interface MyTimezoneConfig {
  ntpServer?: string;
  offline?: boolean;
}

export interface Coordinates {
  longitude: number;
}

export interface Location extends Coordinates {
  formattedAddress?: string;
}

const defaultConfig: Required<MyTimezoneConfig> = {
  ntpServer: 'pool.ntp.org',
  offline: false,
};

const nominatimAPI = 'https://nominatim.openstreetmap.org';

export class MyTimezone {
  private readonly config: Required<MyTimezoneConfig>;
  private readonly ntpClient: NTPClient;

  constructor(config?: MyTimezoneConfig) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
    this.ntpClient = new NTPClient(this.config.ntpServer);
  }

  public async getLocation(location: string): Promise<Location> {
    try {
      const coordinates = this.parseCoordinates(location);
      return coordinates;
    } catch (error) {
      if (error.message.includes('No coordinates parsed')) {
        return this.getLocationByName(location);
      }
      throw error;
    }
  }

  public async getLocationByName(address: string, radius?: string): Promise<Location> {
    const requestConfig: AxiosRequestConfig = {
      method: 'get',
      params: {
        format: 'json',
        limit: 9,
        q: address,
      },
      url: `${nominatimAPI}/search`,
    };

    if (radius) {
      requestConfig.params.radius = radius;
    }

    let results: OSMResult[];

    try {
      const response = await axios.request<OSMResult[]>(requestConfig);
      results = response.data;
    } catch (error) {
      throw new Error(`Nominatim API Error: ${error.message}`);
    }

    if (!results.length) {
      throw new Error('No place found.');
    }

    const {display_name, lon} = results[0];
    const parsedLongitude = parseFloat(lon);

    return {
      formattedAddress: display_name,
      longitude: parsedLongitude,
    };
  }

  public async getTimeByAddress(address: string): Promise<moment.Moment> {
    const {longitude} = await this.getLocationByName(address);
    return this.getTimeByLocation(longitude);
  }

  public async getTimeByLocation(longitude: number): Promise<moment.Moment> {
    const date = await this.getUTCDate();
    const momentDate = moment(date).utc();
    const distance = this.calculateDistance(0, longitude);
    const distanceSeconds = distance / 0.004167;

    const calculatedDate =
      longitude < 0 ? momentDate.subtract(distanceSeconds, 'seconds') : momentDate.add(distanceSeconds, 'seconds');
    return calculatedDate.utc();
  }

  public parseCoordinates(coordinates: string): Coordinates {
    const longitudeRegex = new RegExp('[-?\\W\\d\\.]+,(?<longitude>[-?\\W\\d\\.]+)');
    const parsedRegex = longitudeRegex.exec(coordinates);
    if (parsedRegex?.groups?.longitude) {
      try {
        const longitude = parseFloat(parsedRegex.groups.longitude);
        return {longitude};
      } catch (error) {
        throw new Error(`Invalid coordinates: "${coordinates}"`);
      }
    }
    throw new Error(`No coordinates parsed: "${coordinates}"`);
  }

  private calculateDistance(from: number, to: number): number {
    return Math.abs(from - to);
  }

  private async getUTCDate(): Promise<Date> {
    return this.config.offline ? new Date() : this.ntpClient.getNetworkTime();
  }
}